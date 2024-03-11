import { BrowserEvent, InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import { TraceEvent } from 'analytics'
import { hideSpamAtom } from 'components/AccountDrawer/SpamToggle'
import { useCachedPortfolioBalancesQuery } from 'components/PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import Row from 'components/Row'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import { PortfolioTokenBalancePartsFragment } from 'graphql/data/__generated__/types-and-hooks'
import { PortfolioToken } from 'graphql/data/portfolios'
import { getTokenDetailsURL, gqlToCurrency, logSentryErrorForUnsupportedChain } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { splitHiddenTokens } from 'utils/splitHiddenTokens'

import { hideSmallBalancesAtom } from '../../SmallBalanceToggle'
import { ExpandoRow } from '../ExpandoRow'
import { useToggleAccountDrawer } from '../hooks'
import { PortfolioLogo } from '../PortfolioLogo'
import PortfolioRow, { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'
import { useFetchListCallback } from 'hooks/useFetchListCallback'
import { useAllLists } from 'state/lists/hooks'
import { useWeb3React } from '@web3-react/core'
import useCurrencyBalance, { useTokenBalances } from 'lib/hooks/useCurrencyBalance'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'

export const PLP_TokenList = 'https://raw.githubusercontent.com/1999321/TokenListForPLP/main/tokenList.json'

export default function Tokens({ account }: { account: string }) {
  const toggleWalletDrawer = useToggleAccountDrawer()
  const hideSmallBalances = useAtomValue(hideSmallBalancesAtom)
  const hideSpam = useAtomValue(hideSpamAtom)
  const [showHiddenTokens, setShowHiddenTokens] = useState(false)

  // 需要建立aws的apollo后台,管理用户投资组合的代币
  const { data } = useCachedPortfolioBalancesQuery({ account })

  const tokenBalances = data?.portfolios?.[0].tokenBalances
  const lists = useAllLists()
  const { chainId } = useWeb3React()

  const listToken = lists[PLP_TokenList]?.current?.tokens.filter((value)=>value.chainId == chainId)
  const tokens = listToken?.map((value)=>{return new Token(value.chainId,value.address,value.decimals,value.symbol,value.name)})
  
  const tokenListBalances = useTokenBalances(account,tokens)
  const { visibleTokens, hiddenTokens } = useMemo(
    () => splitHiddenTokens(tokenBalances ?? [], { hideSmallBalances, hideSpam }),
    [hideSmallBalances, tokenBalances, hideSpam]
  )

  //console.log("visibleTokens:",visibleTokens,data,lists[PLP_TokenList]?.current?.tokens,tokenListBalances,tokenListBalances['0x6B175474E89094C44Da98b954EedeAC495271d0F']?.toFixed())

  if (!tokenListBalances) {
    return <PortfolioSkeleton />
  }

  // if (tokenBalances?.length === 0) {
  //   // TODO: consider launching moonpay here instead of just closing the drawer
  //   return <EmptyWalletModule type="token" onNavigateClick={toggleWalletDrawer} />
  // }

  // const toggleHiddenTokens = () => setShowHiddenTokens((showHiddenTokens) => !showHiddenTokens)

  return (
    <PortfolioTabWrapper>
      {tokens?.map(
        (tokenInfo,index) =>
        tokenInfo && <TokenRow key={index} balance={tokenListBalances[tokenInfo.address]} token={tokenInfo} />
      )}
      {/* <ExpandoRow isExpanded={showHiddenTokens} toggle={toggleHiddenTokens} numItems={hiddenTokens.length}>
        {hiddenTokens.map(
          (tokenBalance) =>
            tokenBalance.token && <TokenRow key={tokenBalance.id} {...tokenBalance} token={tokenBalance.token} />
        )}
      </ExpandoRow> */}
    </PortfolioTabWrapper>
  )
}

const TokenBalanceText = styled(ThemedText.BodySecondary)`
  ${EllipsisStyle}
`
const TokenNameText = styled(ThemedText.SubHeader)`
  ${EllipsisStyle}
`

// function TokenRow({
//   token,
//   quantity,
//   denominatedValue,
//   tokenProjectMarket,
// }: any) {
//   const { formatDelta } = useFormatter()
//   const percentChange = tokenProjectMarket?.pricePercentChange?.value ?? 0

//   const navigate = useNavigate()
//   const toggleWalletDrawer = useToggleAccountDrawer()
//   const isInfoExplorePageEnabled = useInfoExplorePageEnabled()

//   // ** 预留功能：点击代币显示相关的细节
//   // const navigateToTokenDetails = useCallback(async () => {
//   //   navigate(getTokenDetailsURL({ ...token, isInfoExplorePageEnabled }))
//   //   toggleWalletDrawer()
//   // }, [navigate, token, isInfoExplorePageEnabled, toggleWalletDrawer])
//   const { formatNumber } = useFormatter()

//   const currency = gqlToCurrency(token)
//   if (!currency) {
//     logSentryErrorForUnsupportedChain({
//       extras: { token },
//       errorMessage: 'Token from unsupported chain received from Mini Portfolio Token Balance Query',
//     })
//     return null
//   }
//   return (
//     <TraceEvent
//       events={[BrowserEvent.onClick]}
//       name={SharedEventName.ELEMENT_CLICKED}
//       element={InterfaceElementName.MINI_PORTFOLIO_TOKEN_ROW}
//       properties={{ chain_id: currency.chainId, token_name: token?.name, address: token?.address }}
//     >
//       <PortfolioRow
//         left={<PortfolioLogo chainId={currency.chainId} currencies={[currency]} size="40px" />}
//         title={<TokenNameText>{token?.name}</TokenNameText>}
//         descriptor={
//           <TokenBalanceText>
//             {formatNumber({
//               input: quantity,
//               type: NumberType.TokenNonTx,
//             })}{' '}
//             {token?.symbol}
//           </TokenBalanceText>
//         }
//         // onClick={navigateToTokenDetails}
//         onClick={()=>{}}
//         right={
//           denominatedValue && (
//             <>
//               <ThemedText.SubHeader>
//                 {formatNumber({
//                   input: denominatedValue?.value,
//                   type: NumberType.PortfolioBalance,
//                 })}
//               </ThemedText.SubHeader>
//               <Row justify="flex-end">
//                 <DeltaArrow delta={percentChange} />
//                 <ThemedText.BodySecondary>{formatDelta(percentChange)}</ThemedText.BodySecondary>
//               </Row>
//             </>
//           )
//         }
//       />
//     </TraceEvent>
//   )
// }

function TokenRow({
  token,
  balance
}: {token: Token,balance: CurrencyAmount<Token> | undefined}) {
  //const { formatDelta } = useFormatter()
  //const percentChange = tokenProjectMarket?.pricePercentChange?.value ?? 0

  // const navigate = useNavigate()
  // const toggleWalletDrawer = useToggleAccountDrawer()
  // const isInfoExplorePageEnabled = useInfoExplorePageEnabled()

  // ** 预留功能：点击代币显示相关的细节
  // const navigateToTokenDetails = useCallback(async () => {
  //   navigate(getTokenDetailsURL({ ...token, isInfoExplorePageEnabled }))
  //   toggleWalletDrawer()
  // }, [navigate, token, isInfoExplorePageEnabled, toggleWalletDrawer])
  const { formatNumber } = useFormatter()

  // const currency = gqlToCurrency(token)
  // if (!currency) {
  //   logSentryErrorForUnsupportedChain({
  //     extras: { token },
  //     errorMessage: 'Token from unsupported chain received from Mini Portfolio Token Balance Query',
  //   })
  //   return null
  // }
  return (
    <TraceEvent
      events={[BrowserEvent.onClick]}
      name={SharedEventName.ELEMENT_CLICKED}
      element={InterfaceElementName.MINI_PORTFOLIO_TOKEN_ROW}
      properties={{ chain_id: token.chainId, token_name: token?.name, address: token?.address }}
    >
      <PortfolioRow
        left={<PortfolioLogo chainId={token.chainId} currencies={[token]} size="40px" />}
        title={<TokenNameText>{token?.name}</TokenNameText>}
        descriptor={
          <TokenBalanceText>
            {formatNumber({
              input: Number(balance?balance.toFixed(4):0),
              type: NumberType.TokenNonTx,
            })}{' '}
            {token?.symbol}
          </TokenBalanceText>
        }
        // onClick={navigateToTokenDetails}
        onClick={()=>{}}
        right={
          balance && (
            <>
              <ThemedText.SubHeader>
                {formatNumber({
                  input: Number(balance.toFixed(4)),
                  type: NumberType.PortfolioBalance,
                })}
              </ThemedText.SubHeader>
              {/* <Row justify="flex-end">
                <DeltaArrow delta={percentChange} />
                <ThemedText.BodySecondary>{formatDelta(percentChange)}</ThemedText.BodySecondary>
              </Row> */}
            </>
          )
        }
      />
    </TraceEvent>
  )
}


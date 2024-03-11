import { SupportedLocale } from 'constants/locales'
import { initialLocale, useActiveLocale } from 'hooks/useActiveLocale'
import { Provider, dynamicActivate } from 'lib/i18n'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { useUserLocaleManager } from 'state/user/hooks'



export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useActiveLocale()
  //console.log("LanguageMenuItems:activeLocale:provider:",locale)
  const [, setUserLocale] = useUserLocaleManager()
  // const [nextLocale,setNextLocale] = useState(locale??initialLocale)

  // useEffect(()=>{
  //   dynamicActivate(initialLocale,locale)
  // },[])

  // useEffect(()=>{
  //   console.log("setNextLocale:",locale)
  //   setNextLocale(locale)
  // },[locale])

  const onActivate = useCallback(
    (locale: SupportedLocale) => {
      //console.log("onActivate:",locale)
      document.documentElement.setAttribute('lang', locale)
      setUserLocale(locale) // stores the selected locale to persist across sessions
    },
    [setUserLocale]
  )

  return (
    <Provider locale={locale??initialLocale} onActivate={onActivate}>
      {children}
    </Provider>
  )
}

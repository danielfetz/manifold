import { useIsAuthorized, useUser } from 'web/hooks/use-user'
import { useEffect } from 'react'
import { call } from 'web/lib/firebase/api'
import { toast } from 'react-hot-toast'
import { getApiUrl } from 'common/api/utils'
import { usePersistentLocalState } from 'web/hooks/use-persistent-local-state'
import { uniq } from 'lodash'
import { MARKET_VISIT_BONUS_TOTAL } from 'common/economy'
import { formatMoney } from 'common/util/format'

export const useRequestNewUserSignupBonus = (contractId: string) => {
  const user = useUser()
  const [newContractIdsVisited, setLastContractIdVisited] =
    usePersistentLocalState([contractId], 'newContractsVisited-' + user?.id)
  const authed = useIsAuthorized()
  const remainingBonuses = useRemainingNewUserSignupBonuses()
  const requestNewUserSignupBonus = async () => {
    const totalPaid = (user?.signupBonusPaid ?? 0) / 100
    const data = await call(getApiUrl('request-signup-bonus'), 'GET').catch(
      (e) => {
        console.log('error', e)
        return { bonus: 0 }
      }
    )
    const { bonus } = data

    if (bonus > 0) {
      toast.success(
        `+${formatMoney(bonus)} for visiting a new question! (${
          totalPaid + bonus / 100
        }/${MARKET_VISIT_BONUS_TOTAL / 100})`,
        {
          duration: 5000,
        }
      )
    } else {
      console.log('no more bonus')
    }
  }
  useEffect(() => {
    if (
      newContractIdsVisited.includes(contractId) ||
      !authed ||
      remainingBonuses <= 0
    )
      return
    requestNewUserSignupBonus()
    setLastContractIdVisited(uniq([...newContractIdsVisited, contractId]))
  }, [contractId, authed])
}

export const useRemainingNewUserSignupBonuses = () => {
  const user = useUser()
  if (!user) return 0
  if (user.signupBonusPaid === undefined) return 0
  return (MARKET_VISIT_BONUS_TOTAL - user.signupBonusPaid) / 100
}

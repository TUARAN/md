import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCreatorProfileStore } from '@/stores/creatorProfile'
import { useUIStore } from '@/stores/ui'
import {
  getCreatorPlatformMatrixForUser,
  listWorkflowCreatorOptions,
  resolveCreatorOffer,
} from '@/utils/userCreator'

export function useWorkflowCreatorContext() {
  const auth = useAuthStore()
  const creatorProfile = useCreatorProfileStore()
  const uiStore = useUIStore()
  const { workflowCreatorId } = storeToRefs(uiStore)

  const resolverOptions = computed(() => ({
    email: auth.user?.email,
    profile: creatorProfile.profile,
  }))

  const activeCreatorId = computed(() => {
    if (creatorProfile.creatorId)
      return creatorProfile.creatorId
    return workflowCreatorId.value
  })

  const offer = computed(() =>
    resolveCreatorOffer(activeCreatorId.value, resolverOptions.value),
  )

  const creators = computed(() => listWorkflowCreatorOptions(resolverOptions.value))

  const platformMatrix = computed(() =>
    getCreatorPlatformMatrixForUser(activeCreatorId.value, resolverOptions.value),
  )

  return {
    resolverOptions,
    activeCreatorId,
    offer,
    creators,
    platformMatrix,
    creatorProfile,
    auth,
  }
}

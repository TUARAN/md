import { getCreatorOffer, TUARAN_CREATOR_ID } from '@/constants/creatorOffer'

export interface WorkflowCreator {
  id: string
  displayName: string
  subtitle: string
}

export interface CreatorPlatformMatrixRow {
  type: string
  url: string
  followers: string
  reads: string
}

const WORKFLOW_CREATORS: WorkflowCreator[] = [
  {
    id: TUARAN_CREATOR_ID,
    displayName: `安东尼`,
    subtitle: `TUARAN · 个人 IP`,
  },
]

export function listWorkflowCreators(): WorkflowCreator[] {
  return WORKFLOW_CREATORS
}

export function getWorkflowCreator(creatorId: string): WorkflowCreator | null {
  const id = creatorId.trim().toLowerCase()
  return WORKFLOW_CREATORS.find(c => c.id === id) ?? null
}

export function getCreatorPlatformMatrix(creatorId: string): CreatorPlatformMatrixRow[] {
  const offer = getCreatorOffer(creatorId)
  if (!offer)
    return []
  return offer.platformMatrix.map(row => ({ ...row }))
}

export function isKnownWorkflowCreator(creatorId: string): boolean {
  return getWorkflowCreator(creatorId) !== null
}

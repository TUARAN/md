import { TUARAN_CREATOR_ID, TUARAN_OFFER } from '@/constants/creatorOffer/tuaran'

export type CreatorOfferContent = typeof TUARAN_OFFER

const OFFER_BY_ID: Record<string, CreatorOfferContent> = {
  [TUARAN_CREATOR_ID]: TUARAN_OFFER,
}

export function getCreatorOffer(creatorId: string) {
  return OFFER_BY_ID[creatorId.trim().toLowerCase()] ?? null
}

export { TUARAN_CREATOR_ID, TUARAN_OFFER }

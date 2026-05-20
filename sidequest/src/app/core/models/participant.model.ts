export interface Participant {
  id: string;
  name: string;
  createdAt: Date;

  /**
   * Firebase Auth UID of the linked user.
   * Present only when the participant has signed in with Google.
   * Undefined for legacy / manually-added participants.
   */
  userId?: string;

  /**
   * Google account email of the linked user.
   * Undefined for legacy participants.
   */
  email?: string;

  /**
   * Google profile photo URL of the linked user.
   * Undefined for legacy participants.
   */
  photoUrl?: string;
  groupId: string;
}

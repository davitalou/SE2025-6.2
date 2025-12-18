using UnityEngine;

public class RoomMatch3Listener : MonoBehaviour, Match3GameListener
{
    public void OnGameStarted(GameStartedParams startedParams) { }

    public void OnGameComplete(GameCompleteParams completeParams)
    {
        if (completeParams == null || !completeParams.isWin)
            return;

        if (string.IsNullOrEmpty(PendingReward.objectId))
            return;

        string objectId = PendingReward.objectId;

        RoomProgress.Unlock(objectId);
        PendingReward.objectId = null;

        Debug.Log("[RoomMatch3Listener] WIN -> Unlock " + objectId);
    }
}


using UnityEngine;

public static class RoomProgress
{
    public static bool IsUnlocked(string objectId)
        => PlayerPrefs.GetInt($"rr_{objectId}_unlocked", 0) == 1;

    public static void Unlock(string objectId)
    {
        PlayerPrefs.SetInt($"rr_{objectId}_unlocked", 1);
        PlayerPrefs.Save();
    }
}

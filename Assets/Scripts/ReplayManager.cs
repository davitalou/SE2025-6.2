using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

[Serializable]
public class ReplayAction
{
    public string type;
    public string target;
    public int variationIndex;
    public float time;
}

[Serializable]
public class InitialState
{
    public string objectName;
    public bool isOwned;
    public int variationIndex;
}

[Serializable]
public class RoomReplay
{
    public string roomName;
    public List<InitialState> initialStates = new List<InitialState>();
    public List<ReplayAction> actions = new List<ReplayAction>();
}

[Serializable]
public class ReplayData
{
    public List<RoomReplay> rooms = new List<RoomReplay>();
}

public class ReplayManager : SingletonInit<ReplayManager>
{
    public string filename = "room_replays.json";

    private ReplayData data = new ReplayData();

    public override void Init()
    {
        base.Init();
        Load();
    }

    private string PathOnDevice()
    {
        return Path.Combine(Application.persistentDataPath, this.filename);
    }

    private void Load()
    {
        try
        {
            string path = PathOnDevice();
            UnityEngine.Debug.Log($"ReplayManager.Load from: {path}");
            if (File.Exists(path))
            {
                string txt = File.ReadAllText(path);
                UnityEngine.Debug.Log($"Loaded replay file, {txt.Length} bytes");
                this.data = JsonUtility.FromJson<ReplayData>(txt) ?? new ReplayData();
                UnityEngine.Debug.Log($"Parsed {this.data.rooms.Count} room replays");
            }
            else
            {
                UnityEngine.Debug.Log("Replay file does not exist yet");
                this.data = new ReplayData();
            }
        }
        catch (Exception ex)
        {
            UnityEngine.Debug.LogWarning("ReplayManager.Load failed: " + ex.Message);
            this.data = new ReplayData();
        }
    }

    private void Save()
    {
        try
        {
            string path = PathOnDevice();
            string txt = JsonUtility.ToJson(this.data, true);
            File.WriteAllText(path, txt);
        }
        catch (Exception ex)
        {
            UnityEngine.Debug.LogWarning("ReplayManager.Save failed: " + ex.Message);
        }
    }

    public RoomReplay GetReplay(string roomName)
    {
        for (int i = 0; i < this.data.rooms.Count; i++)
        {
            if (this.data.rooms[i].roomName == roomName)
                return this.data.rooms[i];
        }
        return null;
    }

    public void StartSession(string roomName, DecoratingScene scene)
    {
        UnityEngine.Debug.Log($"ReplayManager.StartSession called: roomName={roomName}, scene={scene}");
        if (string.IsNullOrEmpty(roomName) || scene == null)
        {
            UnityEngine.Debug.Log($"StartSession aborted: roomName empty={string.IsNullOrEmpty(roomName)}, scene null={scene == null}");
            return;
        }
        RoomReplay rr = GetReplay(roomName);
        if (rr != null)
        {
            // replace existing session with fresh initial state
            this.data.rooms.Remove(rr);
        }
        rr = new RoomReplay();
        rr.roomName = roomName;
        UnityEngine.Debug.Log($"Created new RoomReplay for {roomName}, initializing states from {scene.visualObjectBehaviours.Count} objects");
        for (int i = 0; i < scene.visualObjectBehaviours.Count; i++)
        {
            var vb = scene.visualObjectBehaviours[i];
            var st = new InitialState();
            st.objectName = vb.name.ToLower();
            st.isOwned = vb.visualObject.isOwned;
            st.variationIndex = vb.visualObject.ownedVariationIndex;
            rr.initialStates.Add(st);
        }
        this.data.rooms.Add(rr);
        UnityEngine.Debug.Log($"StartSession saved {rr.initialStates.Count} initial states");
        Save();
    }

    public void RecordAction(string roomName, ReplayAction action)
    {
        UnityEngine.Debug.Log($"ReplayManager.RecordAction: roomName={roomName}, type={action?.type}, target={action?.target}");
        if (string.IsNullOrEmpty(roomName) || action == null)
        {
            UnityEngine.Debug.Log("RecordAction aborted: empty room name or null action");
            return;
        }
        if (!string.IsNullOrEmpty(action.target))
        {
            action.target = action.target.ToLowerInvariant();
        }
        RoomReplay rr = GetReplay(roomName);
        if (rr == null)
        {
            // no session yet - create minimal one
            UnityEngine.Debug.Log($"No existing session for {roomName}, creating new one");
            rr = new RoomReplay();
            rr.roomName = roomName;
            this.data.rooms.Add(rr);
        }
        // force a deterministic order/time based on append order
        float nextTime = (rr.actions.Count == 0) ? 0f : rr.actions[rr.actions.Count - 1].time + 1f;
        action.time = nextTime;
        rr.actions.Add(action);
        UnityEngine.Debug.Log($"Recorded action, now has {rr.actions.Count} actions total");
        Save();
    }
}

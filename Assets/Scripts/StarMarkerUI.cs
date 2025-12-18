using UnityEngine;
using UnityEngine.UI;

public class StarMarkerUI : MonoBehaviour
{
    public VisualObjectBehaviour target;

    private Button _btn;

    private void Awake()
    {
        _btn = GetComponent<Button>();
        if (_btn == null) Debug.LogError("[StarMarkerUI] Missing Button!");
        else _btn.onClick.AddListener(OnClick);
    }

    public void OnClick()
    {
        Debug.Log($"[StarMarkerUI] Clicked star, target = {(target ? target.objectId : "NULL")}");
        if (target == null) return;

        PendingReward.objectId = target.objectId;
        
    }
}

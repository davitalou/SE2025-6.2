using UnityEngine;
using UnityEngine.Rendering;

[DisallowMultipleComponent]
public class StarRenderLock : MonoBehaviour
{
    public string sortingLayerName = "Default";
    public int sortingOrder = 50000;
    public Color forceColor = Color.white; // alpha = 1

    SpriteRenderer[] _renderers;

    void Awake()
    {
        _renderers = GetComponentsInChildren<SpriteRenderer>(true);

        // Tắt các script hay “tự set sorting” trên prefab (để khỏi bị đè)
        var monos = GetComponentsInChildren<MonoBehaviour>(true);
        foreach (var m in monos)
        {
            if (m == null) continue;
            var n = m.GetType().Name;

            // bạn có thể thêm tên script khác nếu project bạn có
            if (n == "SpriteGroup" || n == "StarFxController" || n == "StarConsumeAnim" || n == "StarConsumeAnim2")
            {
                m.enabled = false;
            }
        }

        // SortingGroup cũng hay kéo order âm -> tắt luôn
        var sg = GetComponentInChildren<SortingGroup>(true);
        if (sg != null) sg.enabled = false;
    }

    void LateUpdate()
    {
        // ép lại MỖI FRAME -> script khác không đè được
        for (int i = 0; i < _renderers.Length; i++)
        {
            var sr = _renderers[i];
            if (!sr) continue;

            sr.enabled = true;
            sr.color = forceColor; // trắng + alpha 1
            sr.sortingLayerName = sortingLayerName;
            sr.sortingOrder = sortingOrder;
        }
    }
}

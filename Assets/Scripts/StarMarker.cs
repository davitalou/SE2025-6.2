using UnityEngine;

public class StarMarker : MonoBehaviour
{
    public VisualObjectBehaviour target;

    [HideInInspector] public string forceSortingLayer = "";
    [HideInInspector] public int forceSortingOrder = 0;

    private SpriteRenderer[] _srs;

    void Awake()
    {
        _srs = GetComponentsInChildren<SpriteRenderer>(true);
        ApplySorting(); // ép ngay lúc spawn
    }

    void LateUpdate()
    {
        // nếu có hệ depth khác override thì LateUpdate sẽ kéo lại
        ApplySorting();
    }

    private void ApplySorting()
    {
        // nếu spawner không set thì bỏ qua (để không ảnh hưởng prefab star khác)
        if (string.IsNullOrEmpty(forceSortingLayer)) return;

        foreach (var sr in _srs)
        {
            if (!sr) continue;
            sr.sortingLayerName = forceSortingLayer;
            sr.sortingOrder = forceSortingOrder;
        }
    }

    private void OnMouseDown()
    {
        Debug.Log("STAR CLICKED: " + (target != null ? target.name : "NO TARGET"));
    }
}

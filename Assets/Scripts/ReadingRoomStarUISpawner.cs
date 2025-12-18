using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class ReadingRoomStarUISpawner : MonoBehaviour
{
    [Header("UI")]
    public Canvas markersCanvas;             // MarkersCanvas trong Hierarchy
    public GameObject starUIPrefab;          // Prefab StarUI (UI/Image + Button)
    public RectTransform markersRoot;        // (Optional) 1 empty RectTransform dưới Canvas để chứa stars

    [Header("Targets")]
    public List<VisualObjectBehaviour> targets = new();

    [Header("Star Visual")]
    public float starScale = 1f;              // nếu star nhỏ quá, tăng lên 1.5 / 2
    public Vector2 screenOffset = new(0, 20); // đẩy sao lên chút cho dễ thấy

    private readonly List<GameObject> spawned = new();
    private Coroutine spawnRoutine;

    private void OnEnable()
    {
        // Bật lại canvas (chỉ bật, không tắt ngược lại trong OnDisable của canvas)
        if (markersCanvas != null)
            markersCanvas.gameObject.SetActive(true);

        // Tránh chạy chồng coroutine
        if (spawnRoutine != null) StopCoroutine(spawnRoutine);
        spawnRoutine = StartCoroutine(SpawnNextFrame());
    }

    private void OnDisable()
    {
        // Clear star để không bị "đọng" khi chuyển UI/scene
        ClearStars();

        // Nếu bạn muốn về Home là ẩn hết star UI:
        if (markersCanvas != null)
            markersCanvas.gameObject.SetActive(false);
    }

    private IEnumerator SpawnNextFrame()
    {
        yield return null; // đợi 1 frame để camera/canvas/scene setup xong
        Spawn();
        spawnRoutine = null;
    }

    public void Spawn()
    {
        // ===== Validate =====
        if (markersCanvas == null)
        {
            Debug.LogError("[ReadingRoomStarUISpawner] markersCanvas is NULL. Hãy kéo MarkersCanvas vào field.");
            return;
        }
        if (starUIPrefab == null)
        {
            Debug.LogError("[ReadingRoomStarUISpawner] starUIPrefab is NULL. Hãy kéo StarUI.prefab vào field.");
            return;
        }

        RectTransform parentRect = markersRoot != null
            ? markersRoot
            : markersCanvas.GetComponent<RectTransform>();

        if (parentRect == null)
        {
            Debug.LogError("[ReadingRoomStarUISpawner] parentRect is NULL (Canvas RectTransform missing?)");
            return;
        }

        // Camera dùng để WorldToScreen (camera nhìn room)
        Camera cam = Camera.main;
        if (cam == null)
        {
            Debug.LogError("[ReadingRoomStarUISpawner] Camera.main is NULL. Scene phải có 1 Camera tag MainCamera.");
            return;
        }

        // Camera dùng cho RectTransformUtility:
        // - Overlay => truyền null
        // - ScreenSpaceCamera / WorldSpace => truyền worldCamera
        Camera uiCam = null;
        if (markersCanvas.renderMode != RenderMode.ScreenSpaceOverlay)
        {
            uiCam = markersCanvas.worldCamera != null ? markersCanvas.worldCamera : cam;
        }

        // ===== Clear old stars =====
        ClearStars();

        // ===== Spawn stars =====
        for (int i = 0; i < targets.Count; i++)
        {
            var v = targets[i];
            if (v == null)
            {
                Debug.LogWarning($"[ReadingRoomStarUISpawner] targets[{i}] is NULL -> skip");
                continue;
            }

            // 1) Lấy vị trí world để đặt sao
            Vector3 worldPos = GetWorldAnchor(v);

            // FIX quan trọng: nếu anchor lỡ có z lệch (dẫn tới z < 0), ép z theo object
            // -> tránh trường hợp riêng table bị "behind camera"
            worldPos.z = v.transform.position.z;

            // 2) Ẩn đồ: chỉ tắt renderer, KHÔNG tắt GameObject
            HideVisual(v);

            // 3) Convert world -> screen
            Vector3 screenPos3 = cam.WorldToScreenPoint(worldPos);
            Vector2 screenPos = new Vector2(screenPos3.x, screenPos3.y) + screenOffset;

            // nếu object nằm sau camera thì skip (log rõ để debug)
            if (screenPos3.z < 0)
            {
                Debug.LogWarning($"[ReadingRoomStarUISpawner] SKIP {v.name} behind camera. z={screenPos3.z}, world={worldPos}");
                continue;
            }

            // 4) Screen -> local (Canvas)
            if (!RectTransformUtility.ScreenPointToLocalPointInRectangle(parentRect, screenPos, uiCam, out Vector2 localPoint))
            {
                Debug.LogWarning($"[ReadingRoomStarUISpawner] Convert screen->local failed for {v.name}");
                continue;
            }

            // 5) Instantiate UI star
            GameObject starGO = Instantiate(starUIPrefab, parentRect);
            starGO.name = $"StarUI_{v.name}";

            RectTransform starRT = starGO.GetComponent<RectTransform>();
            if (starRT == null)
            {
                Debug.LogError("[ReadingRoomStarUISpawner] StarUI prefab thiếu RectTransform (phải là UI object).");
                Destroy(starGO);
                continue;
            }

            // (đảm bảo anchor/pivot center, phòng trường hợp prefab bị đổi sau này)
            starRT.anchorMin = new Vector2(0.5f, 0.5f);
            starRT.anchorMax = new Vector2(0.5f, 0.5f);
            starRT.pivot = new Vector2(0.5f, 0.5f);

            starRT.anchoredPosition = localPoint;
            starRT.localScale = Vector3.one * starScale;

            // đảm bảo Image không bị alpha = 0
            var img = starGO.GetComponent<Image>();
            if (img != null)
            {
                Color c = img.color;
                if (c.a < 1f) { c.a = 1f; img.color = c; }
                img.raycastTarget = true;
                img.enabled = true;
            }

            // gán target cho click
            var marker = starGO.GetComponent<StarMarkerUI>();
            if (marker != null) marker.target = v;
            else Debug.LogWarning("[ReadingRoomStarUISpawner] StarUI prefab chưa có StarMarkerUI.");

            spawned.Add(starGO);
        }

        Debug.Log($"[ReadingRoomStarUISpawner] Spawned {spawned.Count} StarUI");
    }

    private void ClearStars()
    {
        for (int i = 0; i < spawned.Count; i++)
        {
            if (spawned[i] != null) Destroy(spawned[i]);
        }
        spawned.Clear();
    }

    private void HideVisual(VisualObjectBehaviour v)
    {
        var renderers = v.GetComponentsInChildren<SpriteRenderer>(true);
        foreach (var r in renderers) r.enabled = false;
    }

    private Vector3 GetWorldAnchor(VisualObjectBehaviour v)
    {
        // Ưu tiên UIAnchor nếu có
        if (v.uiAnchor != null) return v.uiAnchor.position;

        // fallback
        return v.transform.position;
    }
}

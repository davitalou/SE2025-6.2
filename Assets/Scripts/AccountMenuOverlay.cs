using System;
using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Networking;
using UnityEngine.UI;

/// <summary>
/// Lightweight account panel with a toggle button and logout action.
/// </summary>
public class AccountMenuOverlay : MonoBehaviour
{
    private static bool created;
    private static Sprite circleSprite;

    [Header("API")]
    // Đặt URL cho Editor và Runtime (thiết bị). Editor có thể dùng localhost, Runtime dùng IP LAN.
    [SerializeField] private string apiBaseUrlEditor = "http://localhost:3001/api/site";
    [SerializeField] private string apiBaseUrlRuntime = "http://192.168.32.104:3001/api/site";

    private GameObject root;
    private GameObject panel;
    private GameObject changePasswordPanel;
    private GameObject blocker;
    private Button toggleButton;
    private Text nameText;
    private Text emailText;
    private Text cpStatusText;
    private InputField oldPasswordInput;
    private InputField newPasswordInput;
    private InputField confirmPasswordInput;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void Init()
    {
        if (created) return;
        created = true;
        var go = new GameObject("AccountMenuOverlay");
        DontDestroyOnLoad(go);
        go.hideFlags = HideFlags.HideInHierarchy;
        go.AddComponent<AccountMenuOverlay>();
    }

    private void Start()
    {
        EnsureEventSystem();
        BuildUI();
        StartCoroutine(RefreshRoutine());
    }

    private void EnsureEventSystem()
    {
        if (EventSystem.current != null) return;
        var es = new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
        DontDestroyOnLoad(es);
    }

    private void BuildUI()
    {
        // Root canvas
        root = new GameObject("AccountCanvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
        DontDestroyOnLoad(root);
        var canvas = root.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 998; // below auth overlay (999)
        var scaler = root.GetComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920, 1080);

        // Blocker to prevent interaction behind panels
        blocker = CreateImage("AccountBlocker", root.transform, new Color(0, 0, 0, 0.35f));
        Stretch(blocker.GetComponent<RectTransform>());
        var blockerImg = blocker.GetComponent<Image>();
        blockerImg.raycastTarget = true;
        var blockerBtn = blocker.AddComponent<Button>();
        var colors = blockerBtn.colors;
        colors.normalColor = blockerImg.color;
        colors.highlightedColor = blockerImg.color;
        colors.pressedColor = blockerImg.color;
        colors.selectedColor = blockerImg.color;
        colors.disabledColor = blockerImg.color;
        colors.colorMultiplier = 1f;
        blockerBtn.colors = colors;
        blockerBtn.transition = Selectable.Transition.ColorTint;
        blockerBtn.onClick.AddListener(OnBlockerClick);
        blocker.SetActive(false);

        // Toggle button (circular avatar-style) near Home button bottom-left
        toggleButton = CreateButton("AccountToggle", root.transform, "Tài khoản", new Vector2(160, 40), true);
        toggleButton.onClick.AddListener(TogglePanel);

        // Panel
        panel = new GameObject("AccountPanel", typeof(RectTransform), typeof(Image));
        panel.transform.SetParent(root.transform, false);
        var img = panel.GetComponent<Image>();
        img.color = new Color(1f, 0.98f, 0.92f, 0.95f);
        var rect = panel.GetComponent<RectTransform>();
        rect.anchorMin = new Vector2(0, 1);
        rect.anchorMax = new Vector2(0, 1);
        rect.pivot = new Vector2(0, 1);
        rect.anchoredPosition = new Vector2(20, -140);
        rect.sizeDelta = new Vector2(360, 220);

        var layout = panel.AddComponent<VerticalLayoutGroup>();
        layout.padding = new RectOffset(18, 18, 18, 18);
        layout.spacing = 12;
        layout.childAlignment = TextAnchor.UpperLeft;

        nameText = CreateLabel("NameText", panel.transform, "User: -");
        emailText = CreateLabel("EmailText", panel.transform, "Email: -");

        var rowActions = new GameObject("RowActions", typeof(RectTransform), typeof(HorizontalLayoutGroup));
        rowActions.transform.SetParent(panel.transform, false);
        var rowLayout = rowActions.GetComponent<HorizontalLayoutGroup>();
        rowLayout.spacing = 12;
        rowLayout.childAlignment = TextAnchor.MiddleLeft;
        rowLayout.childControlWidth = true;
        rowLayout.childForceExpandWidth = false;

        var changePassBtn = CreateButton("ChangePasswordButton", rowActions.transform, "Đổi mật khẩu", Vector2.zero, false, new Vector2(150, 56));
        changePassBtn.onClick.AddListener(ShowChangePasswordPanel);

        var logoutBtn = CreateButton("LogoutButton", rowActions.transform, "Đăng xuất", Vector2.zero, false, new Vector2(150, 56));
        logoutBtn.onClick.AddListener(DoLogout);

        panel.SetActive(false);
        root.SetActive(false); // hidden until logged in

        // Change password panel (separate, centered)
        changePasswordPanel = new GameObject("ChangePasswordPanel", typeof(RectTransform), typeof(Image));
        changePasswordPanel.transform.SetParent(root.transform, false);
        var cpImg = changePasswordPanel.GetComponent<Image>();
        cpImg.color = new Color(1f, 0.98f, 0.92f, 0.98f);
        var cpRect = changePasswordPanel.GetComponent<RectTransform>();
        cpRect.anchorMin = new Vector2(0.5f, 0.5f);
        cpRect.anchorMax = new Vector2(0.5f, 0.5f);
        cpRect.pivot = new Vector2(0.5f, 0.5f);
        cpRect.anchoredPosition = Vector2.zero;
        cpRect.sizeDelta = new Vector2(620, 440);

        var cpLayoutRoot = changePasswordPanel.AddComponent<VerticalLayoutGroup>();
        cpLayoutRoot.padding = new RectOffset(18, 18, 18, 18);
        cpLayoutRoot.spacing = 12;
        cpLayoutRoot.childAlignment = TextAnchor.UpperLeft;
        cpLayoutRoot.childControlWidth = true;

        CreateTitleLabel("CP_Title", changePasswordPanel.transform, "Đổi mật khẩu");
        CreateSmallLabel("OldPasswordLabel", changePasswordPanel.transform, "Mật khẩu cũ");
        oldPasswordInput = CreateInput("OldPassword", changePasswordPanel.transform, "Mật khẩu cũ", true, 22);
        CreateSmallLabel("NewPasswordLabel", changePasswordPanel.transform, "Mật khẩu mới");
        newPasswordInput = CreateInput("NewPassword", changePasswordPanel.transform, "Mật khẩu mới", true, 22);
        CreateSmallLabel("ConfirmPasswordLabel", changePasswordPanel.transform, "Xác nhận mật khẩu mới");
        confirmPasswordInput = CreateInput("ConfirmPassword", changePasswordPanel.transform, "Xác nhận mật khẩu mới", true, 22);

        var cpButton = CreateButton("ConfirmChange", changePasswordPanel.transform, "Xác nhận", Vector2.zero, false, new Vector2(220, 64));
        cpButton.onClick.AddListener(ConfirmChangePassword);

        cpStatusText = CreateSmallLabel("CP_Status", changePasswordPanel.transform, "");

        changePasswordPanel.SetActive(false);
    }

    private Button CreateButton(string name, Transform parent, string label, Vector2 anchoredPos, bool circular = false, Vector2 sizeOverride = default(Vector2))
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
        go.transform.SetParent(parent, false);
        var rect = go.GetComponent<RectTransform>();
        if (sizeOverride != default(Vector2) && sizeOverride != Vector2.zero)
            rect.sizeDelta = sizeOverride;
        else
            rect.sizeDelta = circular ? new Vector2(84, 84) : new Vector2(160, 56);

        // Default anchor top-left for panel buttons, bottom-left for toggle
        if (anchoredPos != Vector2.zero)
        {
            if (circular)
            {
                rect.anchorMin = new Vector2(0, 0);
                rect.anchorMax = new Vector2(0, 0);
                rect.pivot = new Vector2(0, 0);
            }
            else
            {
                rect.anchorMin = new Vector2(0, 1);
                rect.anchorMax = new Vector2(0, 1);
                rect.pivot = new Vector2(0, 1);
            }
            rect.anchoredPosition = anchoredPos;
        }
        var img = go.GetComponent<Image>();
        img.color = circular ? new Color(0.98f, 0.86f, 0.3f, 0.95f) : new Color(0.95f, 0.72f, 0.28f, 0.95f);
        if (circular)
        {
            if (circleSprite == null)
            {
                circleSprite = GenerateCircleSprite(64);
            }
            img.sprite = circleSprite;
            img.type = Image.Type.Simple;
            img.preserveAspect = true;
        }
        var btn = go.GetComponent<Button>();

        var textGO = new GameObject("Text", typeof(RectTransform), typeof(Text));
        textGO.transform.SetParent(go.transform, false);
        var text = textGO.GetComponent<Text>();
        text.text = label;
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        text.color = Color.black;
        text.fontSize = circular ? 18 : 24;
        text.alignment = TextAnchor.MiddleCenter;
        Stretch(textGO.GetComponent<RectTransform>());

        // Layout element so Horizontal/Vertical layouts respect size
        if (go.GetComponent<LayoutElement>() == null)
        {
            var elem = go.AddComponent<LayoutElement>();
            elem.preferredWidth = rect.sizeDelta.x;
            elem.preferredHeight = rect.sizeDelta.y;
        }
        return btn;
    }

    private InputField CreateInput(string name, Transform parent, string placeholder, bool isPassword, int fontSize = 20)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(InputField));
        go.transform.SetParent(parent, false);
        var rect = go.GetComponent<RectTransform>();
        rect.sizeDelta = new Vector2(0, 48);
        var img = go.GetComponent<Image>();
        img.color = new Color(0.97f, 0.9f, 0.8f, 1f);

        var placeholderGO = new GameObject("Placeholder", typeof(RectTransform), typeof(Text));
        placeholderGO.transform.SetParent(go.transform, false);
        var pText = placeholderGO.GetComponent<Text>();
        pText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        pText.text = placeholder;
        pText.fontSize = fontSize;
        pText.color = new Color(0.25f, 0.2f, 0.18f, 0.6f);
        pText.alignment = TextAnchor.MiddleLeft;

        var textGO = new GameObject("Text", typeof(RectTransform), typeof(Text));
        textGO.transform.SetParent(go.transform, false);
        var tText = textGO.GetComponent<Text>();
        tText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        tText.text = "";
        tText.fontSize = fontSize;
        tText.fontStyle = FontStyle.Bold;
        tText.color = new Color(0.12f, 0.12f, 0.12f);
        tText.alignment = TextAnchor.MiddleLeft;

        StretchWithPadding(placeholderGO.GetComponent<RectTransform>(), new Vector2(12, 0));
        StretchWithPadding(textGO.GetComponent<RectTransform>(), new Vector2(12, 0));

        var input = go.GetComponent<InputField>();
        input.targetGraphic = img;
        input.placeholder = pText;
        input.textComponent = tText;
        if (isPassword) input.contentType = InputField.ContentType.Password;

        var elem = go.AddComponent<LayoutElement>();
        elem.preferredHeight = 52;
        elem.flexibleWidth = 1f;
        elem.minWidth = 0f;
        return input;
    }
    private Text CreateLabel(string name, Transform parent, string content)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Text));
        go.transform.SetParent(parent, false);
        var txt = go.GetComponent<Text>();
        txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        txt.text = content;
        txt.fontSize = 22;
        txt.alignment = TextAnchor.MiddleLeft;
        txt.color = new Color(0.15f, 0.15f, 0.15f);
        var elem = go.AddComponent<LayoutElement>();
        elem.preferredHeight = 32;
        return txt;
    }

    private GameObject CreateImage(string name, Transform parent, Color color)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Image));
        go.transform.SetParent(parent, false);
        var img = go.GetComponent<Image>();
        img.color = color;
        var rect = go.GetComponent<RectTransform>();
        rect.pivot = new Vector2(0.5f, 0.5f);
        rect.anchorMin = rect.anchorMax = new Vector2(0.5f, 0.5f);
        rect.sizeDelta = new Vector2(100, 100);
        return go;
    }

    private void Stretch(RectTransform rect)
    {
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.offsetMin = Vector2.zero;
        rect.offsetMax = Vector2.zero;
    }

    private void StretchWithPadding(RectTransform rect, Vector2 padding)
    {
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.offsetMin = padding;
        rect.offsetMax = -padding;
    }

    private void TogglePanel()
    {
        if (!AuthState.IsLoggedIn)
        {
            panel.SetActive(false);
            return;
        }
        bool show = !panel.activeSelf;
        panel.SetActive(show);
        if (blocker != null) blocker.SetActive(show);
        RefreshTexts();
    }

    private void RefreshTexts()
    {
        if (nameText != null) nameText.text = "User: " + (AuthState.Username ?? "-");
        if (emailText != null) emailText.text = "Email: " + (AuthState.Email ?? "-");
    }

    private Text CreateSmallLabel(string name, Transform parent, string content)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Text));
        go.transform.SetParent(parent, false);
        var txt = go.GetComponent<Text>();
        txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        txt.text = content;
        txt.fontSize = 20;
        txt.fontStyle = FontStyle.Bold;
        txt.alignment = TextAnchor.MiddleLeft;
        txt.color = new Color(0.15f, 0.15f, 0.15f);
        var elem = go.AddComponent<LayoutElement>();
        elem.preferredHeight = 26;
        return txt;
    }

    private Text CreateTitleLabel(string name, Transform parent, string content)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Text));
        go.transform.SetParent(parent, false);
        var txt = go.GetComponent<Text>();
        txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        txt.text = content;
        txt.fontSize = 28;
        txt.fontStyle = FontStyle.Bold;
        txt.alignment = TextAnchor.MiddleCenter;
        txt.color = new Color(0.12f, 0.12f, 0.12f);
        var elem = go.AddComponent<LayoutElement>();
        elem.preferredHeight = 40;
        return txt;
    }

    private void DoLogout()
    {
        AuthState.Clear();
        panel.SetActive(false);
        if (blocker != null) blocker.SetActive(false);
        root.SetActive(false);
        EmailAuthBootstrap.ShowAuth();
    }

    private void ShowChangePasswordPanel()
    {
        if (panel != null) panel.SetActive(false);
        if (changePasswordPanel != null) changePasswordPanel.SetActive(true);
        if (blocker != null) blocker.SetActive(true);
        if (cpStatusText != null) cpStatusText.text = "";
    }

    private void ConfirmChangePassword()
    {
        if (newPasswordInput == null || confirmPasswordInput == null) return;
        string oldPass = oldPasswordInput != null ? oldPasswordInput.text : "";
        string newPass = newPasswordInput.text;
        string confirm = confirmPasswordInput.text;
        if (string.IsNullOrEmpty(newPass) || newPass != confirm)
        {
            if (cpStatusText != null) cpStatusText.text = "Mật khẩu mới không khớp";
            return;
        }
        StartCoroutine(ChangePasswordRoutine(oldPass, newPass, confirm));
    }

    private IEnumerator RefreshRoutine()
    {
        while (true)
        {
            // Chỉ hiện khi đã đăng nhập và đang ở màn trang trí (DecorateRoomScreen hiện diện)
            bool inDecorateScreen = GameObject.FindObjectOfType<DecorateRoomScreen>() != null;
            bool allow = AuthState.IsLoggedIn && inDecorateScreen;
            root.SetActive(allow);
            if (!allow)
            {
                if (panel != null) panel.SetActive(false);
                if (changePasswordPanel != null) changePasswordPanel.SetActive(false);
                if (blocker != null) blocker.SetActive(false);
            }
            yield return new WaitForSeconds(1f);
        }
    }

    private Sprite GenerateCircleSprite(int size)
    {
        var tex = new Texture2D(size, size, TextureFormat.ARGB32, false);
        tex.wrapMode = TextureWrapMode.Clamp;
        Color transparent = new Color(0, 0, 0, 0);
        Color white = Color.white;
        float radius = size / 2f - 1f;
        Vector2 center = new Vector2(size / 2f, size / 2f);
        for (int y = 0; y < size; y++)
        {
            for (int x = 0; x < size; x++)
            {
                float dist = Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f), center);
                tex.SetPixel(x, y, dist <= radius ? white : transparent);
            }
        }
        tex.Apply();
        var sprite = Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), size);
        sprite.name = "GeneratedCircle";
        return sprite;
    }

    private string GetBaseUrl()
    {
        if (Application.isEditor || Application.platform == RuntimePlatform.WindowsPlayer || Application.platform == RuntimePlatform.OSXPlayer)
        {
            return string.IsNullOrWhiteSpace(apiBaseUrlEditor) ? apiBaseUrlRuntime : apiBaseUrlEditor;
        }
        return string.IsNullOrWhiteSpace(apiBaseUrlRuntime) ? apiBaseUrlEditor : apiBaseUrlRuntime;
    }

    private IEnumerator ChangePasswordRoutine(string oldPass, string newPass, string confirm)
    {
        if (cpStatusText != null) cpStatusText.text = "Đang đổi mật khẩu...";
        if (string.IsNullOrEmpty(AuthState.Token))
        {
            if (cpStatusText != null) cpStatusText.text = "Chưa đăng nhập";
            yield break;
        }

        var payload = new ChangePasswordRequest
        {
            oldPassword = oldPass,
            newPassword = newPass,
            confirmPassword = confirm
        };
        string json = JsonUtility.ToJson(payload);

        using (var req = new UnityWebRequest($"{GetBaseUrl()}/change-password", "POST"))
        {
            byte[] body = Encoding.UTF8.GetBytes(json);
            req.uploadHandler = new UploadHandlerRaw(body);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Content-Type", "application/json");
            req.SetRequestHeader("Authorization", $"Bearer {AuthState.Token}");
            yield return req.SendWebRequest();

            string respText = req.downloadHandler != null ? req.downloadHandler.text : "";
            if (req.result == UnityWebRequest.Result.Success || req.responseCode >= 400)
            {
                try
                {
                    var resp = JsonUtility.FromJson<SimpleResponse>(respText);
                    if (resp != null && resp.success)
                    {
                        if (cpStatusText != null) cpStatusText.text = "Đổi mật khẩu thành công";
                        oldPasswordInput.text = "";
                        newPasswordInput.text = "";
                        confirmPasswordInput.text = "";
                        if (changePasswordPanel != null) changePasswordPanel.SetActive(false);
                        if (panel != null) panel.SetActive(true);
                        if (blocker != null) blocker.SetActive(panel != null && panel.activeSelf);
                        yield break;
                    }
                    string msg = resp != null ? resp.message : respText;
                    if (cpStatusText != null) cpStatusText.text = msg;
                }
                catch (Exception)
                {
                    if (cpStatusText != null) cpStatusText.text = respText;
                }
            }
            else
            {
                if (cpStatusText != null) cpStatusText.text = $"Lỗi mạng: {req.error}";
            }
        }
    }

    [Serializable]
    private class ChangePasswordRequest
    {
        public string oldPassword;
        public string newPassword;
        public string confirmPassword;
    }

    [Serializable]
    private class SimpleResponse
    {
        public bool success;
        public string message;
    }

    private void OnBlockerClick()
    {
        if (changePasswordPanel != null && changePasswordPanel.activeSelf)
        {
            changePasswordPanel.SetActive(false);
            if (panel != null) panel.SetActive(true);
            if (blocker != null) blocker.SetActive(panel != null && panel.activeSelf);
            return;
        }
        if (panel != null) panel.SetActive(false);
        if (blocker != null) blocker.SetActive(false);
    }
}

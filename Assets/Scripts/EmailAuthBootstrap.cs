using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

/// <summary>
/// Spawns an email auth UI at runtime without needing scene edits.
/// </summary>
public class EmailAuthBootstrap : MonoBehaviour
{
    private static bool created;
    private static GameObject authRoot;
    private Font defaultFont;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void Init()
    {
        if (created) return;
        created = true;
        var go = new GameObject("EmailAuthBootstrap");
        DontDestroyOnLoad(go);
        go.hideFlags = HideFlags.HideInHierarchy;
        go.AddComponent<EmailAuthBootstrap>();
    }

    private void Start()
    {
        // Unity removed Arial.ttf from builtin resources; LegacyRuntime.ttf is the safe default.
        defaultFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        EnsureEventSystem();
        BuildUI();
    }

    private void EnsureEventSystem()
    {
        if (EventSystem.current != null) return;
        var es = new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
        DontDestroyOnLoad(es);
    }

    private void BuildUI()
    {
        var canvasGo = new GameObject("EmailAuthCanvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
        DontDestroyOnLoad(canvasGo);
        authRoot = canvasGo;
        var canvas = canvasGo.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 999; // on top of existing UI

        var scaler = canvasGo.GetComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920, 1080);

        // Dim background
        var overlay = CreateImage("Overlay", canvasGo.transform, new Color(0, 0, 0, 0.35f));
        var overlayRect = overlay.GetComponent<RectTransform>();
        Stretch(overlayRect);

        // Dialog panel - enlarged 1.5x
        var dialog = CreateImage("EmailAuthDialog", overlay.transform, new Color(1f, 0.93f, 0.85f, 0.97f));
        var dialogRect = dialog.GetComponent<RectTransform>();
        dialogRect.sizeDelta = new Vector2(1080, 840);
        dialogRect.anchorMin = dialogRect.anchorMax = new Vector2(0.5f, 0.5f);
        dialogRect.anchoredPosition = Vector2.zero;
        dialog.AddComponent<HorizontalLayoutGroup>().padding = new RectOffset(24, 24, 24, 24);

        // Content container
        var content = new GameObject("Content", typeof(RectTransform), typeof(VerticalLayoutGroup), typeof(ContentSizeFitter));
        content.transform.SetParent(dialog.transform, false);
        var vLayout = content.GetComponent<VerticalLayoutGroup>();
        vLayout.spacing = 12f;
        vLayout.childControlHeight = true;
        vLayout.childControlWidth = true;
        vLayout.childForceExpandHeight = false;
        vLayout.childForceExpandWidth = true;
        var fitter = content.GetComponent<ContentSizeFitter>();
        fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
        fitter.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;

        // Title
        CreateText("Title", content.transform, "Home Design", 46, TextAnchor.MiddleCenter, new Color(0.15f, 0.35f, 0.9f), FontStyle.Bold);

        // Primary choice buttons (only these show initially)
        var choiceRow = CreateRow(content.transform, 16f);
        var loginPrimary = CreateButton("PrimaryLogin", choiceRow.transform, "Đăng nhập", new Color(0.95f, 0.62f, 0.25f), 28);
        var registerPrimary = CreateButton("PrimaryRegister", choiceRow.transform, "Đăng ký", new Color(0.98f, 0.76f, 0.32f), 28);

        // Inputs
        var formContainer = new GameObject("FormContainer", typeof(RectTransform), typeof(VerticalLayoutGroup));
        formContainer.transform.SetParent(content.transform, false);
        var formLayout = formContainer.GetComponent<VerticalLayoutGroup>();
        formLayout.spacing = 12f;
        formLayout.childAlignment = TextAnchor.UpperCenter;
        formLayout.childControlHeight = true;
        formLayout.childControlWidth = true;
        formLayout.childForceExpandWidth = true;
        formContainer.SetActive(false);

        var username = CreateInput("Username", formContainer.transform, "Username", false, 26);
        var email = CreateInput("Email", formContainer.transform, "Email", false, 26);
        var password = CreateInput("Password", formContainer.transform, "Mật khẩu", true, 26);
        // Confirm password placed directly with same layout as others
        var confirmPassword = CreateInput("ConfirmPassword", formContainer.transform, "Xác nhận mật khẩu", true, 26);

        // Status text
        var status = CreateText("Status", content.transform, "Chọn đăng nhập hoặc đăng ký để tiếp tục", 24, TextAnchor.MiddleLeft, new Color(0.2f, 0.2f, 0.2f), FontStyle.Normal);

        // Action row
        var actionsRow = CreateRow(formContainer.transform, 18f);
        var backButton = CreateButton("Back", actionsRow.transform, "Quay lại", new Color(0.8f, 0.8f, 0.8f), 26);
        var okButton = CreateButton("Submit", actionsRow.transform, "OK", new Color(0.95f, 0.62f, 0.25f), 28);
        var forgotButton = CreateButton("Forgot", actionsRow.transform, "Quên M.khẩu", new Color(0.85f, 0.4f, 0.2f), 26);

        // Forgot password panel
        var forgotPanel = CreateImage("ForgotPanel", overlay.transform, new Color(0.08f, 0.08f, 0.12f, 0.88f));
        forgotPanel.SetActive(false);
        var fpRect = forgotPanel.GetComponent<RectTransform>();
        fpRect.anchorMin = fpRect.anchorMax = new Vector2(0.5f, 0.5f);
        fpRect.sizeDelta = new Vector2(520, 260);
        fpRect.anchoredPosition = Vector2.zero;
        var fpLayout = forgotPanel.AddComponent<VerticalLayoutGroup>();
        fpLayout.padding = new RectOffset(24, 24, 24, 24);
        fpLayout.spacing = 12;
        fpLayout.childAlignment = TextAnchor.UpperCenter;
        CreateText("ForgotTitle", forgotPanel.transform, "Quên mật khẩu", 32, TextAnchor.MiddleCenter, Color.white, FontStyle.Bold);
        var forgotEmail = CreateInput("ForgotEmail", forgotPanel.transform, "Email khôi phục", false, 24);
        var fpActionRow = CreateRow(forgotPanel.transform, 12f);
        var fpConfirm = CreateButton("ConfirmReset", fpActionRow.transform, "Xác nhận", new Color(0.3f, 0.75f, 0.3f), 24);
        var fpClose = CreateButton("CloseReset", fpActionRow.transform, "Đóng", new Color(0.7f, 0.3f, 0.3f), 24);

        // Wire up logic
        var auth = dialog.AddComponent<EmailAuthUI>();
        // TODO: Đặt đúng IP LAN của máy chạy backend khi build mobile, ví dụ: http://192.168.1.10:3001/api/site
        auth.apiBaseUrlEditor = "http://localhost:3001/api/site";
        auth.apiBaseUrlRuntime = "http://192.168.32.103:3001/api/site";
        auth.usernameInput = username;
        auth.emailInput = email;
        auth.passwordInput = password;
        auth.confirmPasswordInput = confirmPassword;
        auth.confirmPasswordGroup = confirmPassword != null ? confirmPassword.gameObject : null;
        auth.statusText = status;
        auth.formContainer = formContainer;
        auth.mainButtonsGroup = choiceRow;
        auth.backButton = backButton;
        auth.forgotPasswordPanel = forgotPanel;
        auth.forgotEmailInput = forgotEmail;
        auth.openLoginButton = loginPrimary;
        auth.openRegisterButton = registerPrimary;
        auth.submitButton = okButton;

        loginPrimary.onClick.AddListener(auth.SelectLogin);
        registerPrimary.onClick.AddListener(auth.SelectRegister);
        okButton.onClick.AddListener(auth.OnSubmit);
        backButton.onClick.AddListener(auth.OnBackToChoice);
        forgotButton.onClick.AddListener(auth.OnOpenForgotPassword);
        fpConfirm.onClick.AddListener(auth.OnRequestPasswordReset);
        fpClose.onClick.AddListener(auth.OnCloseForgotPassword);

        auth.ShowChoiceOnly();
    }

    public static void ShowAuth()
    {
        if (authRoot != null)
        {
            authRoot.SetActive(true);
            var ui = authRoot.GetComponentInChildren<EmailAuthUI>(true);
            if (ui != null)
            {
                ui.ShowChoiceOnly();
            }
        }
    }

    private GameObject CreateRow(Transform parent, float spacing)
    {
        var go = new GameObject("Row", typeof(RectTransform), typeof(HorizontalLayoutGroup));
        go.transform.SetParent(parent, false);
        var layout = go.GetComponent<HorizontalLayoutGroup>();
        layout.spacing = spacing;
        layout.childControlHeight = true;
        layout.childControlWidth = true;
        layout.childForceExpandHeight = false;
        layout.childForceExpandWidth = true;
        return go;
    }

    private GameObject CreateGroup(Transform parent, string name)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(LayoutElement));
        go.transform.SetParent(parent, false);
        var rect = go.GetComponent<RectTransform>();
        rect.anchorMin = new Vector2(0, 0);
        rect.anchorMax = new Vector2(1, 0);
        rect.pivot = new Vector2(0.5f, 0.5f);
        rect.sizeDelta = new Vector2(0, 76f);
        var elem = go.GetComponent<LayoutElement>();
        elem.preferredHeight = 76f; // align with input height
        elem.flexibleWidth = 1f;
        elem.preferredWidth = 0f;
        elem.minWidth = 0f;
        return go;
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

    private Text CreateText(string name, Transform parent, string value, int size, TextAnchor anchor, Color color, FontStyle style = FontStyle.Normal)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Text));
        go.transform.SetParent(parent, false);
        var text = go.GetComponent<Text>();
        text.font = defaultFont;
        text.text = value;
        text.fontSize = size;
        text.fontStyle = style;
        text.alignment = anchor;
        text.color = color;
        var elem = go.AddComponent<LayoutElement>();
        elem.preferredHeight = Mathf.Max(40, size + 12);
        return text;
    }

    private Button CreateButton(string name, Transform parent, string label, Color color, int fontSize = 24)
    {
        var go = CreateImage(name, parent, color);
        go.AddComponent<CanvasRenderer>();
        var btn = go.AddComponent<Button>();
        var colors = btn.colors;
        colors.highlightedColor = color * 1.1f;
        colors.pressedColor = color * 0.9f;
        colors.selectedColor = color;
        colors.colorMultiplier = 1f;
        btn.colors = colors;

        var txt = CreateText("Text", go.transform, label, fontSize, TextAnchor.MiddleCenter, Color.black, FontStyle.Bold);
        var rect = txt.GetComponent<RectTransform>();
        Stretch(rect);
        var elem = go.GetComponent<LayoutElement>();
        if (elem == null) elem = go.AddComponent<LayoutElement>();
        elem.preferredHeight = 80f;
        return btn;
    }

    private InputField CreateInput(string name, Transform parent, string placeholder, bool isPassword = false, int fontSize = 22)
    {
        var go = CreateImage(name, parent, new Color(1f, 0.96f, 0.88f, 1f));
        var img = go.GetComponent<Image>();
        img.color = new Color(0.97f, 0.9f, 0.8f, 1f);

        var placeholderGO = new GameObject("Placeholder", typeof(RectTransform), typeof(Text));
        placeholderGO.transform.SetParent(go.transform, false);
        var placeholderText = placeholderGO.GetComponent<Text>();
        placeholderText.font = defaultFont;
        placeholderText.text = placeholder;
        placeholderText.fontSize = fontSize;
        placeholderText.fontStyle = FontStyle.Normal;
        placeholderText.color = new Color(0.25f, 0.2f, 0.18f, 0.6f);
        placeholderText.alignment = TextAnchor.MiddleLeft;

        var textGO = new GameObject("Text", typeof(RectTransform), typeof(Text));
        textGO.transform.SetParent(go.transform, false);
        var text = textGO.GetComponent<Text>();
        text.font = defaultFont;
        text.text = "";
        text.fontSize = fontSize;
        text.fontStyle = FontStyle.Bold;
        text.color = new Color(0.12f, 0.12f, 0.12f);
        text.alignment = TextAnchor.MiddleLeft;

        Stretch(placeholderGO.GetComponent<RectTransform>(), new Vector2(18, 0));
        Stretch(text.GetComponent<RectTransform>(), new Vector2(18, 0));

        var input = go.AddComponent<InputField>();
        input.targetGraphic = img;
        input.placeholder = placeholderText;
        input.textComponent = text;
        if (isPassword)
        {
            input.contentType = InputField.ContentType.Password;
        }

        var elem = go.GetComponent<LayoutElement>();
        if (elem == null) elem = go.AddComponent<LayoutElement>();
        elem.preferredHeight = 76f;
        elem.flexibleWidth = 1f;
        elem.preferredWidth = 0f;
        elem.minWidth = 0f;
        return input;
    }

    private void Stretch(RectTransform rect, Vector2 padding = default(Vector2))
    {
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.offsetMin = new Vector2(padding.x, padding.y);
        rect.offsetMax = new Vector2(-padding.x, -padding.y);
    }
}

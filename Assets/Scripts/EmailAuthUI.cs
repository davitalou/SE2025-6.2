using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;

public class EmailAuthUI : MonoBehaviour
{
    [Header("API")]
    // Đặt IP LAN của backend để dùng trên thiết bị thật; không dùng localhost trên mobile.
    [SerializeField] public string apiBaseUrlEditor = "http://localhost:3001/api/site";
    [SerializeField] public string apiBaseUrlRuntime = "http://192.168.32.104:3001/api/site";

    [Header("Form Inputs")]
    [SerializeField] public InputField usernameInput;
    [SerializeField] public InputField emailInput;
    [SerializeField] public InputField passwordInput;
    [SerializeField] public InputField confirmPasswordInput;
    [SerializeField] public GameObject confirmPasswordGroup;
    [SerializeField] public Text statusText;
    [SerializeField] public GameObject formContainer;
    [SerializeField] public GameObject mainButtonsGroup;
    [SerializeField] public Button backButton;

    [Header("Forgot Password")]
    [SerializeField] public GameObject forgotPasswordPanel;
    [SerializeField] public InputField forgotEmailInput;

    [Header("Buttons/Tabs")]
    [SerializeField] public Button openLoginButton;
    [SerializeField] public Button openRegisterButton;
    [SerializeField] public Button submitButton;

    private bool isRegisterMode;
    private bool isBusy;

    private void Awake()
    {
        ShowChoiceOnly();
        if (forgotPasswordPanel != null)
        {
            forgotPasswordPanel.SetActive(false);
        }
    }

    public void ShowChoiceOnly()
    {
        isRegisterMode = false;
        ToggleConfirmPassword(false);
        if (formContainer != null) formContainer.SetActive(false);
        if (mainButtonsGroup != null) mainButtonsGroup.SetActive(true);
        if (openLoginButton != null) openLoginButton.gameObject.SetActive(true);
        if (openRegisterButton != null) openRegisterButton.gameObject.SetActive(true);
        if (backButton != null) backButton.gameObject.SetActive(false);
        CloseForgotPanel();
        ClearInputs();
        SetStatus("Chọn đăng nhập hoặc đăng ký để tiếp tục");
    }

    public void SelectLogin()
    {
        isRegisterMode = false;
        ToggleConfirmPassword(false);
        if (formContainer != null) formContainer.SetActive(true);
        if (mainButtonsGroup != null) mainButtonsGroup.SetActive(true);
        if (openRegisterButton != null) openRegisterButton.gameObject.SetActive(false);
        if (openLoginButton != null) openLoginButton.gameObject.SetActive(true);
        if (backButton != null) backButton.gameObject.SetActive(true);
        if (emailInput != null) emailInput.gameObject.SetActive(false); // login only needs username + password
        SetStatus("Đăng nhập bằng email / username");
    }

    public void SelectRegister()
    {
        isRegisterMode = true;
        ToggleConfirmPassword(true);
        if (formContainer != null) formContainer.SetActive(true);
        if (mainButtonsGroup != null) mainButtonsGroup.SetActive(true);
        if (openLoginButton != null) openLoginButton.gameObject.SetActive(false);
        if (openRegisterButton != null) openRegisterButton.gameObject.SetActive(true);
        if (backButton != null) backButton.gameObject.SetActive(true);
        if (emailInput != null) emailInput.gameObject.SetActive(true);
        SetStatus("Đăng ký tài khoản mới");
    }

    public void OnBackToChoice()
    {
        if (isBusy) return;
        ShowChoiceOnly();
    }

    public void OnSubmit()
    {
        if (isBusy) return;
        if (isRegisterMode)
        {
            StartCoroutine(RegisterRoutine());
        }
        else
        {
            StartCoroutine(LoginRoutine());
        }
    }

    public void OnOpenForgotPassword()
    {
        if (forgotPasswordPanel != null)
        {
            forgotPasswordPanel.SetActive(true);
        }
    }

    public void OnCloseForgotPassword()
    {
        CloseForgotPanel();
    }

    public void OnRequestPasswordReset()
    {
        if (isBusy) return;
        StartCoroutine(ForgotPasswordRoutine());
    }

    private IEnumerator LoginRoutine()
    {
        string identifier = SafeValue(usernameInput);
        string password = SafeValue(passwordInput);

        if (string.IsNullOrEmpty(identifier) || string.IsNullOrEmpty(password))
        {
            SetStatus("Vui lòng nhập username và mật khẩu");
            yield break;
        }

        var payload = new LoginRequest { identifier = identifier, password = password };
        yield return PostJson($"{GetBaseUrl()}/login", JsonUtility.ToJson(payload), OnAuthResponse);
    }

    private IEnumerator RegisterRoutine()
    {
        string username = SafeValue(usernameInput);
        string email = SafeValue(emailInput);
        string password = SafeValue(passwordInput);
        string confirm = SafeValue(confirmPasswordInput);

        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
        {
            SetStatus("Vui lòng nhập username, email, mật khẩu");
            yield break;
        }

        if (password != confirm)
        {
            SetStatus("Mật khẩu xác nhận không khớp");
            yield break;
        }

        var payload = new RegisterRequest
        {
            username = username,
            email = email,
            password = password,
            confirmPassword = confirm
        };

        yield return PostJson($"{GetBaseUrl()}/register", JsonUtility.ToJson(payload), OnRegisterResponse);
    }

    private IEnumerator ForgotPasswordRoutine()
    {
        string email = SafeValue(forgotEmailInput);
        if (string.IsNullOrEmpty(email))
        {
            SetStatus("Nhập email để đặt lại mật khẩu");
            yield break;
        }

        var payload = new ForgotPasswordRequest { email = email };
        yield return PostJson($"{GetBaseUrl()}/forgot-password", JsonUtility.ToJson(payload), OnForgotResponse);
    }

    private IEnumerator PostJson(string url, string json, Action<string> onSuccess)
    {
        isBusy = true;
        submitButton.interactable = false;
        SetStatus("Đang xử lý...");

        using (var request = new UnityWebRequest(url, "POST"))
        {
            byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");
            yield return request.SendWebRequest();

            string body = request.downloadHandler != null ? request.downloadHandler.text : "";
            long code = request.responseCode;
            if (request.result == UnityWebRequest.Result.Success)
            {
                onSuccess?.Invoke(body);
            }
            else if (code >= 400 && !string.IsNullOrEmpty(body))
            {
                // server returned an error body; let handler parse message
                onSuccess?.Invoke(body);
            }
            else
            {
                SetStatus($"Lỗi mạng: {request.error}");
            }
        }

        submitButton.interactable = true;
        isBusy = false;
    }

    private void OnAuthResponse(string json)
    {
        try
        {
            var response = JsonUtility.FromJson<AuthResponse>(json);
            if (response != null && response.success)
            {
                SetStatus("Thành công! Đang đăng nhập...");
                AuthState.MarkLoggedIn(response.token, response.user != null ? response.user.username : null, response.user != null ? response.user.email : null);
                // Nếu email chưa có (login bằng username), gọi /me để bổ sung
                if (string.IsNullOrEmpty(AuthState.Email))
                {
                    StartCoroutine(FetchProfile(AuthState.Token));
                }
                // Ẩn UI khi đăng nhập thành công
                var root = transform.root != null ? transform.root.gameObject : gameObject;
                root.SetActive(false);
                return;
            }

            string message = response != null ? response.message : json;
            // Map known messages to localized text
            if (!string.IsNullOrEmpty(message) && message.IndexOf("Chua xac thuc email", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                message = "Chua xac thuc email";
            }
            else if (!string.IsNullOrEmpty(message) && message.IndexOf("Sai ten dang nhap hoac mat khau", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                message = "Sai ten dang nhap hoac mat khau";
            }
            SetStatus($"Thất bại: {message}");
        }
        catch (Exception)
        {
            SetStatus($"Không đọc được phản hồi: {json}");
        }
    }

    private void OnRegisterResponse(string json)
    {
        try
        {
            var response = JsonUtility.FromJson<AuthResponse>(json);
            if (response != null && response.success)
            {
                SetStatus("Đăng ký thành công. Kiểm tra email để xác minh, sau đó đăng nhập.");
                // Không đăng nhập tự động; chuyển sang form đăng nhập
                ClearInputs();
                SelectLogin();
                return;
            }

            string message = response != null ? response.message : "Unknown error";
            SetStatus($"Thất bại: {message}");
        }
        catch (Exception)
        {
            SetStatus($"Không đọc được phản hồi: {json}");
        }
    }

    private void OnForgotResponse(string json)
    {
        try
        {
            var response = JsonUtility.FromJson<SimpleResponse>(json);
            if (response != null && response.success)
            {
                SetStatus("Đã gửi email đặt lại mật khẩu");
                OnCloseForgotPassword();
                return;
            }

            string message = response != null ? response.message : "Unknown error";
            SetStatus($"Không thể gửi: {message}");
        }
        catch (Exception)
        {
            SetStatus($"Không đọc được phản hồi: {json}");
        }
    }

    private void ToggleConfirmPassword(bool visible)
    {
        if (confirmPasswordGroup != null)
        {
            confirmPasswordGroup.SetActive(visible);
        }
    }

    private void CloseForgotPanel()
    {
        if (forgotPasswordPanel != null)
        {
            forgotPasswordPanel.SetActive(false);
        }
    }

    private void SetStatus(string message)
    {
        if (statusText != null)
        {
            statusText.text = message;
        }
    }

    private IEnumerator FetchProfile(string token)
    {
        if (string.IsNullOrEmpty(token)) yield break;
        using (var req = UnityWebRequest.Get($"{GetBaseUrl()}/me"))
        {
            req.SetRequestHeader("Authorization", $"Bearer {token}");
            yield return req.SendWebRequest();
            if (req.result == UnityWebRequest.Result.Success)
            {
                try
                {
                    var resp = JsonUtility.FromJson<AuthResponse>(req.downloadHandler.text);
                    if (resp != null && resp.user != null)
                    {
                        AuthState.UpdateProfile(resp.user.username, resp.user.email);
                        var overlay = GameObject.FindObjectOfType<AccountMenuOverlay>();
                        if (overlay != null) overlay.RefreshUIFromAuthState();
                    }
                }
                catch (Exception ex)
                {
                    UnityEngine.Debug.LogException(ex);
                }
            }
        }
    }

    private void ClearInputs()
    {
        if (usernameInput != null) usernameInput.text = string.Empty;
        if (emailInput != null) emailInput.text = string.Empty;
        if (passwordInput != null) passwordInput.text = string.Empty;
        if (confirmPasswordInput != null) confirmPasswordInput.text = string.Empty;
        if (forgotEmailInput != null) forgotEmailInput.text = string.Empty;
    }

    private string SafeValue(InputField field)
    {
        return field == null ? null : field.text?.Trim();
    }

    private string GetBaseUrl()
    {
        if (Application.isEditor || Application.platform == RuntimePlatform.WindowsPlayer || Application.platform == RuntimePlatform.OSXPlayer)
        {
            return string.IsNullOrWhiteSpace(apiBaseUrlEditor) ? apiBaseUrlRuntime : apiBaseUrlEditor;
        }
        return string.IsNullOrWhiteSpace(apiBaseUrlRuntime) ? apiBaseUrlEditor : apiBaseUrlRuntime;
    }
}

[Serializable]
public class LoginRequest
{
    public string identifier;
    public string password;
}

[Serializable]
public class RegisterRequest
{
    public string username;
    public string email;
    public string password;
    public string confirmPassword;
}

[Serializable]
public class ForgotPasswordRequest
{
    public string email;
}

[Serializable]
public class UserDto
{
    public int id;
    public string username;
    public string email;
}

[Serializable]
public class AuthResponse
{
    public bool success;
    public string message;
    public string token;
    public UserDto user;
}

[Serializable]
public class SimpleResponse
{
    public bool success;
    public string message;
}

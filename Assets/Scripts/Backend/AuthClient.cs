using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

/// <summary>
/// Simple API client to call node-advanced backend (node-backend-api).
/// Attach to a GameObject and call the public coroutines from UI buttons.
/// </summary>
public class AuthClient : MonoBehaviour
{
    [Header("Backend API")]
    [Tooltip("Base URL of the node-backend-api (without trailing slash)")]
    public string BaseUrl = "http://localhost:3001/api/site";

    [Header("State (read-only)")]
    [SerializeField] private string token;
    [SerializeField] private string lastMessage;

    [System.Serializable] private class LoginReq { public string username; public string password; }
    [System.Serializable] private class RegisterReq { public string username; public string email; public string password; public string confirmPassword; }
    [System.Serializable] private class ApiRes { public bool success; public string message; public string token; }

    private void Awake()
    {
        // Load existing token if available
        token = PlayerPrefs.GetString("auth_token", string.Empty);
    }

    public IEnumerator Login(string username, string password)
    {
        var payload = JsonUtility.ToJson(new LoginReq { username = username, password = password });
        var req = BuildRequest($"{BaseUrl}/login", "POST", payload);
        yield return req.SendWebRequest();
        HandleResponse(req, storeToken: true);
    }

    public IEnumerator Register(string username, string email, string password)
    {
        var payload = JsonUtility.ToJson(new RegisterReq
        {
            username = username,
            email = email,
            password = password,
            confirmPassword = password
        });
        var req = BuildRequest($"{BaseUrl}/register", "POST", payload);
        yield return req.SendWebRequest();
        HandleResponse(req, storeToken: false);
    }

    public IEnumerator GetMe()
    {
        var req = BuildRequest($"{BaseUrl}/me", "GET");
        yield return req.SendWebRequest();
        HandleResponse(req, storeToken: false);
    }

    public void LogoutLocal()
    {
        token = string.Empty;
        PlayerPrefs.DeleteKey("auth_token");
    }

    private UnityWebRequest BuildRequest(string url, string method, string jsonBody = null)
    {
        var req = new UnityWebRequest(url, method);
        req.downloadHandler = new DownloadHandlerBuffer();
        if (!string.IsNullOrEmpty(jsonBody))
        {
            req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(jsonBody));
            req.SetRequestHeader("Content-Type", "application/json");
        }
        if (!string.IsNullOrEmpty(token))
        {
            req.SetRequestHeader("Authorization", $"Bearer {token}");
        }
        return req;
    }

    private void HandleResponse(UnityWebRequest req, bool storeToken)
    {
        if (req.result != UnityWebRequest.Result.Success)
        {
            lastMessage = $"HTTP Error {req.responseCode}: {req.error}";
            Debug.LogError(lastMessage);
            return;
        }

        var text = req.downloadHandler.text;
        var res = JsonUtility.FromJson<ApiRes>(text);
        if (res != null)
        {
            lastMessage = res.message;
            if (storeToken && res.success && !string.IsNullOrEmpty(res.token))
            {
                token = res.token;
                PlayerPrefs.SetString("auth_token", token);
            }
        }
        else
        {
            lastMessage = text;
        }
        Debug.Log($"API Response ({req.url}): {lastMessage}");
    }
}

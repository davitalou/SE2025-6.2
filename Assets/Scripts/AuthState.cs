public static class AuthState
{
    public static bool IsLoggedIn { get; private set; }
    public static string Token { get; private set; }
    public static string Username { get; private set; }
    public static string Email { get; private set; }

    public static void MarkLoggedIn(string token, string username = null, string email = null)
    {
        IsLoggedIn = true;
        Token = token;
        Username = username;
        Email = email;
    }

    public static void UpdateProfile(string username = null, string email = null)
    {
        if (!string.IsNullOrEmpty(username))
        {
            Username = username;
        }
        if (!string.IsNullOrEmpty(email))
        {
            Email = email;
        }
    }

    public static void Clear()
    {
        IsLoggedIn = false;
        Token = null;
        Username = null;
        Email = null;
    }
}

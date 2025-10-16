using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Facebook.Unity;

public class FacebookController : MonoBehaviour
{

    private void Awake()
    {
        FB.Init(SetInit, OnHideUnity);
    }

    public void SetInit()
    {

        if (FB.IsLoggedIn)
        {
            Debug.Log("Ok! Login");
        }
        else
        {
            Debug.Log("Not Login");
        }
    }


    public void OnHideUnity(bool isGameShow)
    {
        Debug.Log(isGameShow);
    }


    public void FBLogin()
    {
        List<string> permissions = new List<string>();
        permissions.Add("public_profile");

        FB.LogInWithReadPermissions(permissions, AuthCallResult);
    }

    void AuthCallResult(ILoginResult loginResult)
    {

        if (loginResult.Error!=null)
        {
            Debug.Log(loginResult.Error);

        }
        else
        {
            if (FB.IsLoggedIn)
            {
                Debug.Log("Login success");
                Debug.Log(loginResult.RawResult);
            }
            else
            {
                Debug.Log("Login Failed");
            }
        }

    }
}

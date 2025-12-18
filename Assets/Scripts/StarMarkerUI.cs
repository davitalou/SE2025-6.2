using UnityEngine;
using UnityEngine.UI;

public class StarMarkerUI : MonoBehaviour
{
    public VisualObjectBehaviour target;

    void Awake()
    {
        var btn = GetComponent<Button>();
        if (btn != null)
            btn.onClick.AddListener(OnClick);
    }

    void OnClick()
    {
        Debug.Log("STAR CLICKED: " + (target ? target.name : "NO TARGET"));
    }
}

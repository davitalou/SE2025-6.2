using UnityEngine;

public class StarMarker : MonoBehaviour
{
    public VisualObjectBehaviour target;

    private void OnMouseDown()
    {
        Debug.Log("STAR CLICKED: " + (target != null ? target.name : "NO TARGET"));
    }
}

#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;

[CustomEditor(typeof(DecoratingScene))]
public class GraphicsSceneConfigEditor : Editor
{
    public override void OnInspectorGUI()
    {
        base.OnInspectorGUI();
        DecoratingScene scene = (DecoratingScene)target;

        if (scene.config == null || scene.config.objects == null) return;
    }

    private void OnSceneGUI()
    {
        DecoratingScene scene = (DecoratingScene)target;
        if (scene.config == null || scene.config.objects == null) return;

        foreach (var obj in scene.config.objects)
        {
            if (obj.hitboxTriangles == null) continue;
            foreach (var triangle in obj.hitboxTriangles)
            {
                Handles.color = Color.red;
                Vector3[] points = {
                    new Vector3(triangle.p1.x, triangle.p1.y, 0),
                    new Vector3(triangle.p2.x, triangle.p2.y, 0),
                    new Vector3(triangle.p3.x, triangle.p3.y, 0)
                };
                Handles.DrawAAConvexPolygon(points);

                EditorGUI.BeginChangeCheck();
                Vector2 newP1 = Handles.PositionHandle(new Vector3(triangle.p1.x, triangle.p1.y, 0), Quaternion.identity);
                Vector2 newP2 = Handles.PositionHandle(new Vector3(triangle.p2.x, triangle.p2.y, 0), Quaternion.identity);
                Vector2 newP3 = Handles.PositionHandle(new Vector3(triangle.p3.x, triangle.p3.y, 0), Quaternion.identity);
                if (EditorGUI.EndChangeCheck())
                {
                    triangle.p1 = newP1;
                    triangle.p2 = newP2;
                    triangle.p3 = newP3;
                    EditorUtility.SetDirty(scene);
                }
            }
        }
    }
}
#endif
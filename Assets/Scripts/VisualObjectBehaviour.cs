using System;
using System.Collections.Generic;
using JSONData;
using UnityEngine;

public class VisualObjectBehaviour : MonoBehaviour
{
    public Transform uiAnchor;
    public string objectId;

    public bool isPlayerControlledObject
    {
        get { return this.variations != null && this.variations.Count > 0; }
    }

    public bool hasDefaultVariation
    {
        get { return this.defaultVariation != null; }
    }

    public Vector3 iconHandlePosition
    {
        get
        {
            if (this.visualObject == null)
                return Vector3.zero;

            Vector3 vector = this.visualObject.iconHandlePosition;
            if (this.visualObjectOverride != null)
            {
                vector += this.visualObjectOverride.iconHandlePositionOffset;
            }
            return vector;
        }
    }

    public Vector3 iconHandleScale
    {
        get
        {
            if (this.visualObjectOverride == null)
            {
                return Vector3.one;
            }
            return this.visualObjectOverride.iconHandlePositionScale;
        }
    }

    public Quaternion iconHandleRotation
    {
        get
        {
            if (this.visualObjectOverride == null)
            {
                return Quaternion.identity;
            }
            return Quaternion.Euler(this.visualObjectOverride.iconHandleRotation);
        }
    }

    public VisualObjectVariation activeVariation
    {
        get
        {
            if (this.visualObject == null || this.variations == null)
                return null;

            int idx = this.visualObject.ownedVariationIndex;
            if (idx < 0 || idx >= this.variations.Count)
                return null;

            return this.variations[idx];
        }
    }

    public void SetMarkersActive(bool active)
    {
        GGUtil.SetActive(this.markersTransform, active);
    }

    public void InitMarkers(GameObject markerPrefab)
    {
        if (!this.isPlayerControlledObject)
        {
            return;
        }
        if (this.isMarkersCreated)
        {
            return;
        }
        this.isMarkersCreated = true;
        this.markersTransform = new GameObject("markers").transform;
        this.markersTransform.parent = base.transform;
        this.markersTransform.localPosition = Vector3.zero;
        this.markersTransform.localScale = Vector3.one;

        if (this.visualObject == null)
        {
            Debug.LogError($"[VOB] visualObject is NULL in InitMarkers. GameObject={name}", this);
            GGUtil.SetActive(this.markersTransform, false);
            return;
        }

        List<ShapeGraphShape> dashLines = this.visualObject.dashLines;
        if (dashLines == null || dashLines.Count == 0)
        {
            GGUtil.SetActive(this.markersTransform, false);
            return;
        }

        List<Vector2> list = new List<Vector2>();
        int depthForMarkerLines = this.visualObject.depthForMarkerLines;
        for (int i = 0; i < dashLines.Count; i++)
        {
            GameObject gameObject = UnityEngine.Object.Instantiate<GameObject>(markerPrefab);
            gameObject.transform.parent = this.markersTransform;
            gameObject.transform.localPosition = Vector3.zero;
            gameObject.transform.localScale = Vector3.one;
            gameObject.transform.localRotation = Quaternion.identity;

            DistortedSprite component = gameObject.GetComponent<DistortedSprite>();
            GGUtil.SetActive(component, true);
            component.sortingSettings.sortingOrder = depthForMarkerLines;

            ShapeGraphShape shapeGraphShape = dashLines[i];
            List<Vector2> list2 = list;
            list2.Clear();

            for (int j = 0; j < shapeGraphShape.points.Count; j++)
            {
                Vector2 item = shapeGraphShape.points[j];
                list2.Add(item);
            }

            if (shapeGraphShape.GetOrientation() == ShapeGraphShape.Orientation.CW)
            {
                component.bl = list2[0];
                component.tl = list2[1];
                component.tr = list2[2];
                component.br = list2[3];
            }
            else
            {
                component.bl = list2[3];
                component.tl = list2[2];
                component.tr = list2[1];
                component.br = list2[0];
            }

            component.CreateGeometry();
            GGUtil.SetActive(gameObject, true);
        }
    }

    private VisualObjectVariation CreateVariation(GraphicsSceneConfig.Variation variation)
    {
        VisualObjectVariation visualObjectVariation = new GameObject
        {
            transform =
            {
                parent = base.transform,
                localPosition = Vector3.zero
            },
            name = variation.name
        }.AddComponent<VisualObjectVariation>();

        visualObjectVariation.Init(this, variation);
        return visualObjectVariation;
    }

    public void InitRuntimeData(DecoratingSceneConfig.RoomConfig roomConfig)
    {
        this.visualObjectOverride = null;
        if (roomConfig == null)
        {
            return;
        }

        if (this.visualObject == null)
        {
            Debug.LogError($"[VOB] visualObject is NULL in InitRuntimeData. GameObject={name}", this);
            return;
        }

        SceneObjectsDB.SceneObjectInfo sceneObjectInfo = this.visualObject.sceneObjectInfo;
        if (sceneObjectInfo.isVisualObjectOverriden)
        {
            this.visualObjectOverride = sceneObjectInfo.objectOverride;
        }

        if (Application.isEditor)
        {
            DecoratingSceneConfig.VisualObjectOverride objectOverride = roomConfig.GetObjectOverride(this.visualObject.name);
            if (objectOverride != null && !objectOverride.isSettingSaved)
            {
                this.visualObjectOverride = objectOverride;
            }
        }
    }

    public void Init(RoomsBackend.RoomAccessor roomAccessor)
    {
        if (this.visualObject == null)
        {
            Debug.LogError($"[VOB] visualObject is NULL in Init(roomAccessor). GameObject={name}", this);
            return;
        }
        this.visualObject.Init(roomAccessor);
    }

    public void Init(GraphicsSceneConfig.VisualObject visualObject)
    {
        this.visualObject = visualObject;

        // reset lists to avoid duplicated init
        if (this.variations == null) this.variations = new List<VisualObjectVariation>();
        if (this.allVariations == null) this.allVariations = new List<VisualObjectVariation>();
        this.variations.Clear();
        this.allVariations.Clear();
        this.defaultVariation = null;

        if (visualObject == null)
        {
            Debug.LogError($"[VOB] Init called with NULL visualObject. GameObject={name}", this);
            return;
        }

        for (int i = 0; i < visualObject.variations.Count; i++)
        {
            GraphicsSceneConfig.Variation variation = visualObject.variations[i];
            VisualObjectVariation item = this.CreateVariation(variation);
            this.variations.Add(item);
            this.allVariations.Add(item);
        }

        if (visualObject.hasDefaultVariation && visualObject.defaultVariation != null)
        {
            this.defaultVariation = this.CreateVariation(visualObject.defaultVariation);
            this.allVariations.Add(this.defaultVariation);
        }
    }

    public void DestroySelf()
    {
        for (int i = 0; i < this.allVariations.Count; i++)
        {
            VisualObjectVariation visualObjectVariation = this.allVariations[i];
            if (!(visualObjectVariation == null))
            {
                visualObjectVariation.DestroySelf();
            }
        }
        this.variations.Clear();
        this.allVariations.Clear();
        VisualObjectBehaviour.Destroy(base.gameObject);
    }

    public void SetVisualState()
    {
        if (this.visualObject == null)
        {
            Debug.LogError($"[VOB] SetVisualState: visualObject NULL on GameObject={name}", this);
            this.Hide();
            return;
        }

        //this.visualObject.isOwned = false;
        bool isOwned = this.visualObject.isOwned;

        // Not owned -> show default variation if exists, else hide
        if (!isOwned)
        {
            if (this.defaultVariation != null)
            {
                this.ShowVariation(this.defaultVariation);
            }
            else
            {
                //this.visualObject.isOwned = false;
                this.Hide();
            }
            return;
        }

        // Owned -> show selected variation index safely
        int idx = this.visualObject.ownedVariationIndex;
        if (idx < 0 || idx >= this.variations.Count)
        {
            Debug.LogError(
                $"[VOB] Owned but variation index out of range. obj={this.visualObject.name} idx={idx} variations={this.variations.Count} (GameObject={name})",
                this
            );
            // fallback: hide to avoid crash
            this.Hide();
            return;
        }

        this.ShowVariationBehaviour(idx);
    }

    public void ShowVariationBehaviour(int variationIndex)
    {
        VisualObjectVariation variation = null;
        if (variationIndex >= 0 && variationIndex < this.variations.Count)
        {
            variation = this.variations[variationIndex];
        }
        this.ShowVariation(variation);
    }

    private void ShowVariation(VisualObjectVariation variation)
    {
        if (this.allVariations == null)
        {
            Debug.LogError($"[VOB] allVariations NULL on GameObject={name}", this);
            return;
        }

        int variationIndex = -1;
        for (int i = 0; i < this.allVariations.Count; i++)
        {
            VisualObjectVariation visualObjectVariation = this.allVariations[i];
            if (visualObjectVariation == null)
            {
                // skip null entries to avoid NullReference
                continue;
            }

            bool flag = (visualObjectVariation == variation);
            if (flag)
            {
                variationIndex = i;
            }
            visualObjectVariation.SetActive(flag);
        }

        if (this.characterBehaviour != null)
        {
            this.characterBehaviour.ShowGlobalVariation(variationIndex);
        }
    }

    public void Hide()
    {
        this.ShowVariation(null);
    }

    void HideAll()
    {
        for (int i = 0; i < variations.Count; i++)
            variations[i].SetActive(false);
    }


    public static void Destroy(GameObject obj)
    {
        if (!Application.isPlaying)
        {
            UnityEngine.Object.DestroyImmediate(obj);
            return;
        }
        UnityEngine.Object.Destroy(obj);
    }

    public VisualObjectVariation defaultVariation;
    public List<VisualObjectVariation> variations = new List<VisualObjectVariation>();
    public List<VisualObjectVariation> allVariations = new List<VisualObjectVariation>();

    public GraphicsSceneConfig.VisualObject visualObject;

    [SerializeField]
    public CharacterVisualObjectBehaviour characterBehaviour;

    private DecoratingSceneConfig.VisualObjectOverride visualObjectOverride;
    private bool isMarkersCreated;

    [NonSerialized]
    private Transform markersTransform;
}
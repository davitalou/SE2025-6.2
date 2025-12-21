using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class VariationButton : MonoBehaviour
{

	public void Init(VariationPanel variationPanel, VisualObjectBehaviour visualObjectBehaviour, int variationIndex)
	{
		this.visualObjectBehaviour = visualObjectBehaviour;

		var v = (visualObjectBehaviour != null && visualObjectBehaviour.variations != null
				 && variationIndex >= 0 && variationIndex < visualObjectBehaviour.variations.Count)
			? visualObjectBehaviour.variations[variationIndex]
			: null;

		Sprite thumb = (v != null) ? v.thumbnailSprite : null;

		Debug.Log(
			$"[VariationButton] obj={(visualObjectBehaviour != null ? visualObjectBehaviour.name : "NULL")} " +
			$"idx={variationIndex} " +
			$"var={(v != null ? v.name : "NULL")} " +
			$"thumbNull={(thumb == null)} " +
			$"imageNull={(image == null)} " +
			$"imageSpriteNull={(image != null ? (image.sprite == null).ToString() : "N/A")}",
			this
		);

		// Guard để không crash:
		if (image == null)
		{
			Debug.LogError("[VariationButton.Init] image component chưa gán trong Inspector", this);
			return;
		}

		if (thumb == null)
		{
			Debug.LogWarning($"[VariationButton.Init] thumbnailSprite NULL -> ẩn button. obj={visualObjectBehaviour.name}, idx={variationIndex}", this);
			image.enabled = false; // hoặc SetActive(false)
			return;
		}

		image.enabled = true;
		image.sprite = thumb;

		this.variationIndex = variationIndex;
		this.variationPanel = variationPanel;

		// Từ đây mới được đọc rect
		this._imageHeight = thumb.rect.height;
		this._ratio = thumb.rect.width / thumb.rect.height;

		Fit();
	}


	public void Fit()
	{
		RectTransform component = this.background.GetComponent<RectTransform>();
		float width = component.rect.width;
		float height = component.rect.height;
		this.imageWidth = width;
		this.imageHeight = height;
		this.imageWidth = Mathf.Min(width - (float)this.leftMargin - (float)this.rightMargin, this.imageWidth);
		this.imageHeight = Mathf.Min(height - (float)this.topMargin - (float)this.bottomMargin, this.imageHeight);
		Vector3 localPosition = this.image.transform.localPosition;
		localPosition.x = (component.rect.xMin + (float)this.leftMargin) * 0.5f + (component.rect.xMax - (float)this.rightMargin) * 0.5f;
		localPosition.y = (component.rect.yMin + (float)this.bottomMargin) * 0.5f + (component.rect.yMax - (float)this.topMargin) * 0.5f;
		this.image.transform.localPosition = localPosition;
	}

	public float ratio
	{
		get
		{
			return this._ratio;
		}
	}

	public float imageWidth
	{
		get
		{
			return this.imageHeight * this.ratio;
		}
		set
		{
			this.imageHeight = value / this.ratio;
			this.Resize();
		}
	}

	public float imageHeight
	{
		get
		{
			return this._imageHeight;
		}
		set
		{
			this._imageHeight = value;
			this.Resize();
		}
	}

	public void Resize()
	{
		RectTransform component = this.image.GetComponent<RectTransform>();
		component.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal, this.imageWidth);
		component.SetSizeWithCurrentAnchors(RectTransform.Axis.Vertical, this.imageHeight);
	}

	public void OnClick()
	{
		int ownedVariationIndex = this.visualObjectBehaviour.visualObject.ownedVariationIndex;
		this.visualObjectBehaviour.visualObject.ownedVariationIndex = this.variationIndex;
		this.visualObjectBehaviour.ShowVariationBehaviour(this.variationIndex);
		this.visualObjectBehaviour.activeVariation.ScaleAnimation(0f, false);
		GGSoundSystem.Play(GGSoundSystem.SFXType.Flip);
		if (this.variationPanel != null)
		{
			this.variationPanel.ButtonCallback_OnChange();
		}
	}

	[SerializeField]
	public Image image;

	[SerializeField]
	public Image background;

	[SerializeField]
	public int topMargin;

	[SerializeField]
	public int bottomMargin;

	[SerializeField]
	public int leftMargin;

	[SerializeField]
	public int rightMargin;

	[SerializeField]
	public List<Sprite> sprites = new List<Sprite>();

	private float _imageHeight;


	private float _ratio;

	[NonSerialized]
	private int variationIndex;

	[NonSerialized]
	private VisualObjectBehaviour visualObjectBehaviour;

	private VariationPanel variationPanel;
}

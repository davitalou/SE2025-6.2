using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using GGMatch3;

public class TestLevel0Helper : MonoBehaviour
{
    public void OnTestLevel0ButtonClick()
    {
        StartLevel0Game();
    }

    private void StartLevel0Game()
    {
        if (!BehaviourSingleton<EnergyManager>.instance.HasEnergyForOneLife())
        {
            // Có thể bỏ qua check energy cho test
            // OutOfLivesDialog @object = NavigationManager.instance.GetObject<OutOfLivesDialog>();
            // ... nhưng để đơn giản, giả sử có energy
        }

        GameScreen gameScreen = NavigationManager.instance.GetObject<GameScreen>();
        Match3StagesDB.Stage stage = Match3StagesDB.instance.stages[0]; // Force level 0

        Match3GameParams initParams = new Match3GameParams();
        initParams.level = stage.levelReference.level;
        if (stage.multiLevelReference.Count > 0)
        {
            List<Match3StagesDB.LevelReference> multiLevelReference = stage.multiLevelReference;
            for (int i = 0; i < multiLevelReference.Count; i++)
            {
                LevelDefinition level = multiLevelReference[i].level;
                if (level != null)
                {
                    initParams.levelsList.Add(level);
                }
            }
        }
        initParams.stage = stage;
        initParams.levelIndex = 0; // Force level 0
        initParams.listener = FindObjectOfType<DecorateRoomScreen>(); // Set listener để handle game complete

        GiftsDefinitionDB.BuildupBooster.BoosterGift boosterGift = ScriptableObjectSingleton<GiftsDefinitionDB>.instance.buildupBooster.GetBoosterGift();
        if (boosterGift != null)
        {
            initParams.giftBoosterLevel = boosterGift.level;
            List<BoosterConfig> boosterConfig = boosterGift.boosterConfig;
            for (int j = 0; j < boosterConfig.Count; j++)
            {
                BoosterConfig item = boosterConfig[j];
                initParams.activeBoosters.Add(item);
            }
        }

        gameScreen.Show(initParams);
        GGSoundSystem.Play(GGSoundSystem.MusicType.GameMusic);
    }
}
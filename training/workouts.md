# Workout library

Ten shared stimuli with separate running and cycling prescriptions. Edit this Markdown file, then import it in Workout Library. The single JSON block is the source used by the planner. Ranges are [minimum, default, maximum]; times are seconds and RPE is 1–10. Recovery occurs BETWEEN repetitions, and set recovery BETWEEN sets; no recovery follows the final repetition. Total duration includes warmup, work, recoveries, finish and cooldown.

Defaults are starting protocols from the owner's specification, not a required training distribution. The LLM chooses progression, recovery, tapering, sport-specific parameters and conflict resolution. Library bounds constrain execution; no fixed 80/20 rule is imposed. Rest and the target event are calendar entries outside the ten training primitives. FTP percentages are cycling-only; missing FTP does not invent watts. Moderate/hard templates conservatively count as hard for scheduling.

Evidence context (these reviews do not establish every exact parameter range below):
- [Training intensity distributions](https://pubmed.ncbi.nlm.nih.gov/38717713/)
- [Running intensity distribution](https://pubmed.ncbi.nlm.nih.gov/34749417/)
- Owner-provided additional references: https://pubmed.ncbi.nlm.nih.gov/41740126/ , https://pubmed.ncbi.nlm.nih.gov/36165995/ , https://pubmed.ncbi.nlm.nih.gov/39788807/

```json
{
  "version": 1,
  "templates": [
    {
      "id": "ENDURANCE",
      "name": "Easy endurance",
      "goal": "Aerobic base",
      "structure": "continuous",
      "intensity": "easy",
      "long": false,
      "progression": "Increase duration gradually when appropriate; the LLM chooses recovery and tapering.",
      "sports": {
        "run": {
          "parameters": {
            "warmupSeconds": [
              0,
              0,
              0
            ],
            "workSeconds": [
              1800,
              2700,
              5400
            ],
            "repetitions": [
              1,
              1,
              1
            ],
            "recoverySeconds": [
              0,
              0,
              0
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              0,
              0,
              0
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              2,
              3,
              4
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": null,
          "targetCue": "Use running-specific pace/HR where known; RPE is the fallback. Easy means conversational, below LT1/VT1 where known."
        },
        "ride": {
          "parameters": {
            "warmupSeconds": [
              0,
              0,
              0
            ],
            "workSeconds": [
              2700,
              3600,
              10800
            ],
            "repetitions": [
              1,
              1,
              1
            ],
            "recoverySeconds": [
              0,
              0,
              0
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              0,
              0,
              0
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              2,
              3,
              4
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": [
            55,
            65,
            75
          ],
          "targetCue": "Use cycling power where available; RPE is the fallback. Do not equate cycling power with running pace."
        }
      }
    },
    {
      "id": "LONG_ENDURANCE",
      "name": "Long easy",
      "goal": "Aerobic capacity and durability",
      "structure": "continuous",
      "intensity": "easy",
      "long": true,
      "progression": "Increase duration gradually when appropriate; the LLM chooses recovery and tapering.",
      "sports": {
        "run": {
          "parameters": {
            "warmupSeconds": [
              0,
              0,
              0
            ],
            "workSeconds": [
              3600,
              5400,
              10800
            ],
            "repetitions": [
              1,
              1,
              1
            ],
            "recoverySeconds": [
              0,
              0,
              0
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              0,
              0,
              0
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              2,
              3,
              4
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": null,
          "targetCue": "Use running-specific pace/HR where known; RPE is the fallback. Easy means conversational, below LT1/VT1 where known."
        },
        "ride": {
          "parameters": {
            "warmupSeconds": [
              0,
              0,
              0
            ],
            "workSeconds": [
              7200,
              10800,
              21600
            ],
            "repetitions": [
              1,
              1,
              1
            ],
            "recoverySeconds": [
              0,
              0,
              0
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              0,
              0,
              0
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              2,
              3,
              4
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": [
            55,
            65,
            75
          ],
          "targetCue": "Use cycling power where available; RPE is the fallback. Do not equate cycling power with running pace."
        }
      }
    },
    {
      "id": "TEMPO",
      "name": "Tempo",
      "goal": "Sustainable speed or power",
      "structure": "interval",
      "intensity": "hard",
      "long": false,
      "progression": "Increase work duration or repetitions before intensity. Planner selects race specificity and recovery.",
      "sports": {
        "run": {
          "parameters": {
            "warmupSeconds": [
              480,
              600,
              1200
            ],
            "workSeconds": [
              600,
              600,
              1800
            ],
            "repetitions": [
              2,
              3,
              4
            ],
            "recoverySeconds": [
              120,
              180,
              300
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              300,
              420,
              900
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              5,
              6,
              7
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": null,
          "targetCue": "Use running-specific pace/HR where known; RPE is the fallback. Easy means conversational, below LT1/VT1 where known."
        },
        "ride": {
          "parameters": {
            "warmupSeconds": [
              480,
              600,
              1200
            ],
            "workSeconds": [
              600,
              900,
              1800
            ],
            "repetitions": [
              2,
              3,
              4
            ],
            "recoverySeconds": [
              120,
              180,
              300
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              300,
              420,
              900
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              5,
              6,
              7
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": [
            76,
            85,
            90
          ],
          "targetCue": "Use cycling power where available; RPE is the fallback. Do not equate cycling power with running pace."
        }
      }
    },
    {
      "id": "THRESHOLD",
      "name": "Threshold",
      "goal": "LT2 / FTP / race-specific endurance",
      "structure": "interval",
      "intensity": "hard",
      "long": false,
      "progression": "Increase repetitions or work duration before intensity. Running uses threshold-specific effort, not FTP percentages.",
      "sports": {
        "run": {
          "parameters": {
            "warmupSeconds": [
              480,
              600,
              1200
            ],
            "workSeconds": [
              360,
              600,
              900
            ],
            "repetitions": [
              3,
              4,
              6
            ],
            "recoverySeconds": [
              120,
              180,
              240
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              300,
              420,
              900
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              6,
              7,
              8
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": null,
          "targetCue": "Use running-specific pace/HR where known; RPE is the fallback. Easy means conversational, below LT1/VT1 where known."
        },
        "ride": {
          "parameters": {
            "warmupSeconds": [
              480,
              600,
              1200
            ],
            "workSeconds": [
              360,
              600,
              900
            ],
            "repetitions": [
              3,
              4,
              6
            ],
            "recoverySeconds": [
              120,
              180,
              240
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              300,
              420,
              900
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              6,
              7,
              8
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": [
            91,
            97,
            105
          ],
          "targetCue": "Use cycling power where available; RPE is the fallback. Do not equate cycling power with running pace."
        }
      }
    },
    {
      "id": "VO2_LONG",
      "name": "Long VO₂ intervals",
      "goal": "VO₂max / aerobic power",
      "structure": "interval",
      "intensity": "hard",
      "long": false,
      "progression": "Increase repetitions, then work duration, then reduce recovery within bounds. Do not increase intensity first. Example 4×4 → 5×4 → 4×5; LLM decides deload.",
      "sports": {
        "run": {
          "parameters": {
            "warmupSeconds": [
              480,
              600,
              1200
            ],
            "workSeconds": [
              180,
              240,
              300
            ],
            "repetitions": [
              3,
              4,
              6
            ],
            "recoverySeconds": [
              90,
              180,
              300
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              300,
              420,
              900
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              8,
              8,
              9
            ]
          },
          "totalWorkSeconds": [
            720,
            1500
          ],
          "recoveryRatio": [
            0.5,
            1
          ],
          "ftpPercent": null,
          "targetCue": "Use running-specific pace/HR where known; RPE is the fallback. Easy means conversational, below LT1/VT1 where known."
        },
        "ride": {
          "parameters": {
            "warmupSeconds": [
              480,
              600,
              1200
            ],
            "workSeconds": [
              180,
              240,
              300
            ],
            "repetitions": [
              3,
              4,
              6
            ],
            "recoverySeconds": [
              90,
              180,
              300
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              300,
              420,
              900
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              8,
              8,
              9
            ]
          },
          "totalWorkSeconds": [
            720,
            1500
          ],
          "recoveryRatio": [
            0.5,
            1
          ],
          "ftpPercent": [
            105,
            110,
            120
          ],
          "targetCue": "Use cycling power where available; RPE is the fallback. Do not equate cycling power with running pace."
        }
      }
    },
    {
      "id": "VO2_SHORT",
      "name": "Short VO₂ intervals",
      "goal": "Time near VO₂max",
      "structure": "interval",
      "intensity": "hard",
      "long": false,
      "progression": "Use 30/30, 40/20 or 60/30-style parameters within bounds; increase total work before intensity.",
      "sports": {
        "run": {
          "parameters": {
            "warmupSeconds": [
              480,
              600,
              1200
            ],
            "workSeconds": [
              30,
              30,
              90
            ],
            "repetitions": [
              10,
              10,
              30
            ],
            "recoverySeconds": [
              15,
              30,
              90
            ],
            "sets": [
              1,
              2,
              3
            ],
            "setRecoverySeconds": [
              120,
              180,
              300
            ],
            "cooldownSeconds": [
              300,
              420,
              900
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              8,
              8,
              9
            ]
          },
          "totalWorkSeconds": [
            600,
            1200
          ],
          "recoveryRatio": [
            0.3333333333333333,
            1
          ],
          "ftpPercent": null,
          "targetCue": "Use running-specific pace/HR where known; RPE is the fallback. Easy means conversational, below LT1/VT1 where known."
        },
        "ride": {
          "parameters": {
            "warmupSeconds": [
              480,
              600,
              1200
            ],
            "workSeconds": [
              30,
              30,
              90
            ],
            "repetitions": [
              10,
              10,
              30
            ],
            "recoverySeconds": [
              15,
              30,
              90
            ],
            "sets": [
              1,
              2,
              3
            ],
            "setRecoverySeconds": [
              120,
              180,
              300
            ],
            "cooldownSeconds": [
              300,
              420,
              900
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              8,
              8,
              9
            ]
          },
          "totalWorkSeconds": [
            600,
            1200
          ],
          "recoveryRatio": [
            0.3333333333333333,
            1
          ],
          "ftpPercent": null,
          "targetCue": "Use cycling power where available; RPE is the fallback. Do not equate cycling power with running pace."
        }
      }
    },
    {
      "id": "SPRINT",
      "name": "Neuromuscular sprints",
      "goal": "Speed / power / coordination",
      "structure": "interval",
      "intensity": "hard",
      "long": false,
      "progression": "Preserve long recovery and short efforts. Running favors controlled strides/hills; do not turn this into VO₂ or Wingate training.",
      "sports": {
        "run": {
          "parameters": {
            "warmupSeconds": [
              480,
              600,
              1200
            ],
            "workSeconds": [
              6,
              10,
              15
            ],
            "repetitions": [
              4,
              6,
              10
            ],
            "recoverySeconds": [
              90,
              180,
              300
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              300,
              420,
              900
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              8,
              9,
              10
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": null,
          "targetCue": "Controlled strides or short hill accelerations; full recovery."
        },
        "ride": {
          "parameters": {
            "warmupSeconds": [
              480,
              600,
              1200
            ],
            "workSeconds": [
              6,
              10,
              15
            ],
            "repetitions": [
              4,
              6,
              10
            ],
            "recoverySeconds": [
              90,
              180,
              300
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              300,
              420,
              900
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              9,
              10,
              10
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": null,
          "targetCue": "Use cycling power where available; RPE is the fallback. Do not equate cycling power with running pace."
        }
      }
    },
    {
      "id": "ANAEROBIC",
      "name": "Hard short intervals",
      "goal": "Anaerobic capacity",
      "structure": "interval",
      "intensity": "hard",
      "long": false,
      "progression": "Use selectively for the event and athlete; preserve recovery. Not the default endurance stimulus.",
      "sports": {
        "run": {
          "parameters": {
            "warmupSeconds": [
              480,
              600,
              1200
            ],
            "workSeconds": [
              30,
              45,
              60
            ],
            "repetitions": [
              4,
              6,
              10
            ],
            "recoverySeconds": [
              90,
              180,
              240
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              300,
              420,
              900
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              9,
              9,
              10
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": null,
          "targetCue": "Use running-specific pace/HR where known; RPE is the fallback. Easy means conversational, below LT1/VT1 where known."
        },
        "ride": {
          "parameters": {
            "warmupSeconds": [
              480,
              600,
              1200
            ],
            "workSeconds": [
              30,
              45,
              60
            ],
            "repetitions": [
              4,
              6,
              10
            ],
            "recoverySeconds": [
              90,
              180,
              240
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              300,
              420,
              900
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              9,
              9,
              10
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": null,
          "targetCue": "Use cycling power where available; RPE is the fallback. Do not equate cycling power with running pace."
        }
      }
    },
    {
      "id": "PROGRESSIVE",
      "name": "Progressive endurance",
      "goal": "Aerobic endurance and fatigue resistance",
      "structure": "progressive",
      "intensity": "hard",
      "long": false,
      "progression": "Begin easy and finish moderate/controlled; do not turn every finish into a maximal effort. Conservatively counts as hard for scheduling.",
      "sports": {
        "run": {
          "parameters": {
            "warmupSeconds": [
              0,
              0,
              0
            ],
            "workSeconds": [
              1200,
              1800,
              3600
            ],
            "repetitions": [
              1,
              1,
              1
            ],
            "recoverySeconds": [
              0,
              0,
              0
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              180,
              300,
              600
            ],
            "finishSeconds": [
              300,
              600,
              1800
            ],
            "intensityRpe": [
              2,
              3,
              4
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": null,
          "targetCue": "Use running-specific pace/HR where known; RPE is the fallback. Easy means conversational, below LT1/VT1 where known."
        },
        "ride": {
          "parameters": {
            "warmupSeconds": [
              0,
              0,
              0
            ],
            "workSeconds": [
              1800,
              2700,
              7200
            ],
            "repetitions": [
              1,
              1,
              1
            ],
            "recoverySeconds": [
              0,
              0,
              0
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              180,
              300,
              600
            ],
            "finishSeconds": [
              300,
              900,
              1800
            ],
            "intensityRpe": [
              2,
              3,
              4
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": [
            55,
            65,
            75
          ],
          "targetCue": "Use cycling power where available; RPE is the fallback. Do not equate cycling power with running pace."
        }
      }
    },
    {
      "id": "RECOVERY",
      "name": "Recovery",
      "goal": "Recovery / circulation",
      "structure": "continuous",
      "intensity": "easy",
      "long": false,
      "progression": "Keep very easy. The LLM chooses recovery days/weeks; a recovery session does not replace a required rest day.",
      "sports": {
        "run": {
          "parameters": {
            "warmupSeconds": [
              0,
              0,
              0
            ],
            "workSeconds": [
              1200,
              1800,
              3600
            ],
            "repetitions": [
              1,
              1,
              1
            ],
            "recoverySeconds": [
              0,
              0,
              0
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              0,
              0,
              0
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              1,
              2,
              3
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": null,
          "targetCue": "Use running-specific pace/HR where known; RPE is the fallback. Easy means conversational, below LT1/VT1 where known."
        },
        "ride": {
          "parameters": {
            "warmupSeconds": [
              0,
              0,
              0
            ],
            "workSeconds": [
              1200,
              1800,
              3600
            ],
            "repetitions": [
              1,
              1,
              1
            ],
            "recoverySeconds": [
              0,
              0,
              0
            ],
            "sets": [
              1,
              1,
              1
            ],
            "setRecoverySeconds": [
              0,
              0,
              0
            ],
            "cooldownSeconds": [
              0,
              0,
              0
            ],
            "finishSeconds": [
              0,
              0,
              0
            ],
            "intensityRpe": [
              1,
              2,
              3
            ]
          },
          "totalWorkSeconds": null,
          "recoveryRatio": null,
          "ftpPercent": [
            40,
            50,
            55
          ],
          "targetCue": "Use cycling power where available; RPE is the fallback. Do not equate cycling power with running pace."
        }
      }
    }
  ]
}
```

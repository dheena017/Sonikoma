import { ai, hf, Type } from '../config/clients.js';

/**
 * Helper function to generate rich story dialogs/captions dynamically without hardcoding
 */
export async function generateDynamicPanels(title: string, genre: string, episode: string, imgUrls: string[], model: string): Promise<any[]> {
  const activeCutsCount = Math.min(imgUrls.length, 8);
  const prompt = `You are a cinematic comic book editor and storyteller.
Given this Comic Webtoon information:
Title: "${title}"
Genre: "${genre}"
Episode: "${episode}"

Please generate exactly ${activeCutsCount} distinct chronological narration or panel speech lines.
For each of the ${activeCutsCount} panels, provide:
1. "speech_text": An engaging, atmospheric description (under 20 words).
2. "sfx": A punchy comic-style sound effect in brackets.
3. "motion_type": One of 'zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'pan_up', 'pan_down'.

Output strictly valid JSON with top-level key "panels".`;

  if (model.startsWith('huggingface') && hf) {
    try {
      console.log(`[HuggingFace] Creating storyboard using Mistral 7B for "${title}"`);
      const response = await hf.chatCompletion({
        model: 'mistralai/Mistral-7B-Instruct-v0.3',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const responseText = response.choices[0].message.content || "";
      const parsedAI = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
      if (parsedAI && Array.isArray(parsedAI.panels)) {
          return parsedAI.panels.slice(0, activeCutsCount).map((p: any, idx: number) => ({
              id: idx + 1,
              image_url: imgUrls[idx],
              original_image_url: imgUrls[idx],
              speech_text: p.speech_text || `Scene ${idx + 1}`,
              sfx: p.sfx || "[Action]",
              duration: 5.0,
              motion_type: p.motion_type || "zoom_in"
          }));
      }
    } catch (e: any) {
      if (e.message && e.message.includes("sufficient permissions")) {
          console.log('[HuggingFace] Inference Provider permission denied. Falling back silently to Gemini.');
      } else {
        console.warn('HuggingFace failed, falling back...', e);
      }
    }
  }

  if (ai) {
    try {
      const aiResponse = await ai.models.generateContent({
        model: model || "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              panels: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speech_text: { type: Type.STRING },
                    sfx: { type: Type.STRING },
                    motion_type: { type: Type.STRING }
                  },
                  required: ["speech_text", "sfx", "motion_type"]
                }
              }
            },
            required: ["panels"]
          }
        }
      });

      const responseText = aiResponse.text?.trim() || "";
      if (responseText) {
        const parsedAI = JSON.parse(responseText);
        if (parsedAI && Array.isArray(parsedAI.panels) && parsedAI.panels.length > 0) {
          console.log(`[Gemini] Storyboard narration generated successfully for ${activeCutsCount} cuts.`);
          return parsedAI.panels.slice(0, activeCutsCount).map((p: any, idx: number) => ({
            id: idx + 1,
            image_url: imgUrls[idx],
            original_image_url: imgUrls[idx],
            speech_text: p.speech_text || `Scene ${idx + 1} of ${title}`,
            sfx: p.sfx || "[Action Sounds]",
            duration: 4.5,
            motion_type: p.motion_type || "zoom_in"
          }));
        }
      }
    } catch (err: any) {
      if (err.status === 429) {
        console.warn("[Gemini Script] Quota limit reached, waiting to retry once...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        try {
          const aiResponse = await ai.models.generateContent({
            model: model || "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  panels: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        speech_text: { type: Type.STRING },
                        sfx: { type: Type.STRING },
                        motion_type: { type: Type.STRING }
                      },
                      required: ["speech_text", "sfx", "motion_type"]
                    }
                  }
                },
                required: ["panels"]
              }
            }
          });

          const responseText = aiResponse.text?.trim() || "";
          if (responseText) {
            const parsedAI = JSON.parse(responseText);
            if (parsedAI && Array.isArray(parsedAI.panels) && parsedAI.panels.length > 0) {
              return parsedAI.panels.slice(0, activeCutsCount).map((p: any, idx: number) => ({
                id: idx + 1,
                image_url: imgUrls[idx],
                original_image_url: imgUrls[idx],
                speech_text: p.speech_text || `Scene ${idx + 1} of ${title}`,
                sfx: p.sfx || "[Action Sounds]",
                duration: 4.5,
                motion_type: p.motion_type || "zoom_in"
              }));
            }
          }
        } catch (retryErr: any) {
          console.warn("[Gemini Script] Retry also failed. Falling back.", retryErr.message);
        }
      } else {
        console.warn("[Gemini Script] Storyboard generation failed, falling back.", err.message);
      }
    }
  }

  const panelsList = [];
  for (let i = 0; i < activeCutsCount; i++) {
    let text = "";
    let sfx = "";
    let motion = "zoom_in";

    if (i === 0) {
      text = `Welcome to the legendary path of ${title}! The grand chronicle of the ${episode} of this ${genre} saga starts here.`;
      sfx = "[Chime Echo]";
      motion = "zoom_in";
    } else if (i === activeCutsCount - 1) {
      text = `And thus is the peak climax of ${episode} of ${title} completed! What epic struggles lie ahead?`;
      sfx = "[Impact Strike]";
      motion = "zoom_out";
    } else {
      const dynamicTexts = [
        `Tensions escalate rapidly across the ${genre} zone, forcing characters to adapt immediately.`,
        `A mysterious shadows crawls quietly, casting an unexpected veil of magic over the path.`,
        `Crucial keys and ancient memories are laid bare, revealing a hidden side of ${title}.`,
        `An absolute burst of brilliant energy sweeps the frame! Destiny is set in motion.`,
        `Silence fills the space as allies stand tall together, ready to confront the ultimate mystery.`
      ];
      text = dynamicTexts[(i - 1) % dynamicTexts.length];
      
      const sfxs = ["[Soft Whoosh]", "[Drums Rumble]", "[Sparkling Shimmer]", "[Energy Flare]", "[Low Resonance]"];
      sfx = sfxs[(i - 1) % sfxs.length];
      
      const motions = ["pan_right", "pan_left", "pan_up", "zoom_out", "pan_down"];
      motion = motions[(i - 1) % motions.length];
    }

    panelsList.push({
      id: i + 1,
      image_url: imgUrls[i],
      original_image_url: imgUrls[i],
      speech_text: text,
      sfx: sfx,
      duration: 4.5,
      motion_type: motion
    });
  }
  return panelsList;
}

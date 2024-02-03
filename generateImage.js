// generateCommand.js
import axios from 'axios';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';

global.imageUrls = global.imageUrls || {};

function getImageUrlByIndex(interactionId, index) {
  return global.imageUrls[interactionId] ? global.imageUrls[interactionId][index] : null;
}

const generateCommand = async (interaction, checkJobQueue) => {
  const userInput = interaction.options.getString('input');
  await interaction.deferReply();

  const queueStatus = await checkJobQueue();
  if (queueStatus) {
    await interaction.followUp(`Current queue: ${queueStatus.running_size} running jobs. Processing might take some time.`);
  }

  try {
    const startResponse = await axios.post('http://127.0.0.1:8888/v1/generation/text-to-image', {
      prompt: userInput,
      negative_prompt: "(worst quality, greyscale), watermark, username, signature, text, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, jpeg artifacts, bad feet, extra fingers, mutated hands, poorly drawn hands, bad proportions, extra limbs, disfigured, bad anatomy, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, mutated hands, fused fingers, too many fingers, long neck,ng_deepnegative_v1_75t, flat chest, tiny tits, cross eyes, cartoon, 3d, anime, negative_hand-neg, oversaturated, blurry, art, painting, rendering, drawing, sketch, long neck, low quality, worst quality, monochrome, watermark, tan lines, necklace, fingers,",
        style_selections: [
            "Fooocus V2",
            "Fooocus Enhance",
            "Fooocus Sharp",
            "Fooocus Masterpiece",
            "Fooocus Photograph",
            "Fooocus Negative",
            "Fooocus Cinematic"
        ],
        performance_selection: "Speed",
        aspect_ratios_selection: "1344*768",
        image_number: 4,
        image_seed: -1,
        sharpness: 2,
        guidance_scale: 4,
        base_model_name: "juggernautXL_v8Rundiffusion.safetensors",
        refiner_model_name: "None",
        refiner_switch: 0.5,
        loras: [
        {
            model_name: "sd_xl_offset_example-lora_1.0.safetensors",
            weight: 0.1
        },
        {
          model_name: "add_detail.safetensors",
          weight: 1
        },
        {
          model_name: "godpussy1_v4.safetensors",
          weight: 0.8
        }

        ],
        advanced_params: {
            adaptive_cfg: 7,
            adm_scaler_end: 0.3,
            adm_scaler_negative: 0.8,
            adm_scaler_positive: 1.5,
            canny_high_threshold: 128,
            canny_low_threshold: 64,
            controlnet_softness: 0.25,
            debugging_cn_preprocessor: false,
            debugging_inpaint_preprocessor: false,
            disable_preview: false,
            freeu_b1: 1.01,
            freeu_b2: 1.02,
            freeu_enabled: false,
            freeu_s1: 0.99,
            freeu_s2: 0.95,
            inpaint_disable_initial_latent: false,
            inpaint_engine: "v1",
            inpaint_erode_or_dilate: 0,
            inpaint_respective_field: 1,
            inpaint_strength: 1,
            invert_mask_checkbox: false,
            mixing_image_prompt_and_inpaint: false,
            mixing_image_prompt_and_vary_upscale: false,
            overwrite_height: -1,
            overwrite_step: -1,
            overwrite_switch: -1,
            overwrite_upscale_strength: -1,
            overwrite_vary_strength: -1,
            overwrite_width: -1,
            refiner_swap_method: "joint",
            sampler_name: "dpmpp_2m_sde_gpu",
            scheduler_name: "karras",
            skipping_cn_preprocessor: false
        },
        require_base64: false,
        async_process: true,
        webhook_url: ""
      }, {
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      });

      const jobId = startResponse.data.job_id;
    if (jobId) {
      await interaction.editReply(`Image generation started. Job ID: ${jobId}. Please wait...`);

      // Function to periodically check job status
      const checkStatus = async () => {
        const statusResponse = await axios.get(`http://127.0.0.1:8888/v1/generation/query-job?job_id=${jobId}&require_step_preview=true`);
        const { job_stage, job_progress, job_result, job_step_preview } = statusResponse.data;

        if (job_stage !== 'SUCCESS' && job_step_preview) {
          // Update with real-time preview if available
          const previewBuffer = Buffer.from(job_step_preview, 'base64');
          await interaction.editReply({ 
            content: `**Job ID:** ${jobId}\n**Progress:** ${job_progress}%\nPreview:`, 
            files: [new AttachmentBuilder(previewBuffer, { name: 'preview.png' })] 
          });
        } else if (job_stage === 'SUCCESS') {
          clearInterval(statusCheckInterval); // Stop checking the job status
          // Final update with the result
          let files = job_result.map(image => ({ attachment: image.url }));
          let components = createButtonRows(); // Assuming you have a function to create your button rows

          await interaction.editReply({ 
            content: `Image generation complete.`, 
            files: files, 
            components: components 
          });

          // Update global.imageUrls for interaction with the final images
          global.imageUrls[interaction.id] = job_result.map(image => image.url);
        } else if (job_stage === 'ERROR') {
          clearInterval(statusCheckInterval); // Stop checking the job status
          await interaction.editReply(`Image generation failed.`);
        }
      };

      const statusCheckInterval = setInterval(checkStatus, 10000); // Adjust interval as needed
    } else {
      await interaction.editReply('Failed to start image generation. No job ID returned.');
    }
  } catch (error) {
    console.error('Error in image generation:', error);
    await interaction.editReply('Failed to start image generation.');
  }
};

function createButtonRows() {
  // First row with buttons for upscaling (U1-U4) and refreshing the images
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId('U1').setLabel('U1').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('U2').setLabel('U2').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('U3').setLabel('U3').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('U4').setLabel('U4').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('refresh').setLabel('🔄 Refresh').setStyle(ButtonStyle.Primary)
    );

  // Second row with buttons for applying variations (V1-V4)
  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId('V1').setLabel('V1').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('V2').setLabel('V2').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('V3').setLabel('V3').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('V4').setLabel('V4').setStyle(ButtonStyle.Secondary)
    );

  // Additional rows can be added here if needed for more functionalities
  
  return [row1, row2]; // Return an array of action rows
}


export { getImageUrlByIndex, generateCommand };
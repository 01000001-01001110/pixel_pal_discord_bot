// generateCommand.js
import axios from 'axios';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

global.imageUrls = global.imageUrls || {};

function getImageUrlByIndex(interactionId, index) {
  return global.imageUrls[interactionId] ? global.imageUrls[interactionId][index] : null;
}

// Assuming checkJobQueue is defined elsewhere and passed as a parameter
const generateCommand = async (interaction, checkJobQueue) => {
  const userInput = interaction.options.getString('input');
  // Default to 1 if not provided; adjust according to your actual command options
  const numberOfImages = interaction.options.getInteger('number_of_images') || 1;

  await interaction.deferReply();

  // Check the job queue status
  const queueStatus = await checkJobQueue();
  
  if (queueStatus) {
    await interaction.followUp(`Current queue: ${queueStatus.running_size} running jobs. Processing might take some time.`);
  }

  try {
    // Adjust API request to include the number of images
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
        try {
          const statusResponse = await axios.get(`http://127.0.0.1:8888/v1/generation/query-job?job_id=${jobId}`);
          const jobStatus = statusResponse.data.job_status;

          if (jobStatus === 'Finished') {
            clearInterval(statusInterval);
          
            // Handle multiple images
            const images = statusResponse.data.job_result;
            let files = []; // Array to store file attachments
          
            for (const image of images) {
              // Append each image to the files array
              files.push({ attachment: image.url });
            }
          
            // Create an array to hold the rows of buttons
            const rows = [];
          
            // First row with U1-U4 and Refresh
            const row1 = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('U1')
                  .setLabel('U1')
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId('U2')
                  .setLabel('U2')
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId('U3')
                  .setLabel('U3')
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId('U4')
                  .setLabel('U4')
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId('refresh')
                  .setStyle(ButtonStyle.Primary)
                  .setEmoji('🔄'),
              );
            rows.push(row1);
          
            // Second row with V1-V4
            const row2 = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('V1')
                  .setLabel('V1')
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId('V2')
                  .setLabel('V2')
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId('V3')
                  .setLabel('V3')
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId('V4')
                  .setLabel('V4')
                  .setStyle(ButtonStyle.Secondary)
              );
            rows.push(row2);

            const generatedImages = []; // Assume this array holds the generated image URLs
            global.imageUrls[interaction.id] = generatedImages;

            // Send the final images as attachments with the buttons
            const replyContent = `**${userInput}** - Generated Images:
             **U1-U4**: Upscale the image to 2x its original size.
             **V1-V4**: Apply a slight variation to the image.
             **🔄**: Refresh to see new variations.`;
            await interaction.editReply({ content: replyContent, files: files, components: rows });

          } else if (jobStatus === 'Failed') {
            clearInterval(statusInterval);
            await interaction.editReply('Image generation failed.');
          } else if (!jobStatus || jobStatus === 'null') {
            // Fetch queue information if job status is not available
            const queueInfo = await checkJobQueue();
            if (queueInfo) {
              await interaction.editReply(`Queue information: ${queueInfo.running_size} running jobs. Your job is in the queue. Please wait...`);
            } else {
              await interaction.editReply(`Waiting for job status...`);
            }
          } else {
            await interaction.editReply(`Current status: ${jobStatus}. Please wait...`);
          }
        } catch (error) {
          console.error('Status check error:', error);
          clearInterval(statusInterval);
          await interaction.editReply('Failed to check image generation status.');
        }
      };

      const statusInterval = setInterval(checkStatus, 10000); // Check every 10 seconds
    } else {
      await interaction.editReply('Failed to start image generation. No job ID returned.');
    }
  } catch (error) {
    console.error('Error in image generation:', error);
    await interaction.editReply('Failed to start image generation.');
  }
};

export { getImageUrlByIndex, generateCommand };

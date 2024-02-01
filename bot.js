//Bot backup that works and has queue status and image description and buttons

import FormData from 'form-data';
import { 
  Client,
  GatewayIntentBits,
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder,
  ButtonStyle  
} from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Function to check job queue status
const checkJobQueue = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8888/v1/generation/job-queue');
    return response.data;
  } catch (error) {
    console.error('Error fetching job queue status:', error);
    return null;
  }
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    switch (interaction.customId) {
      case 'Upscale 2x':
          await interaction.followUp('U1 button clicked!');
          break;
      case 'Vary Slightly':
          await interaction.followUp('V1 button clicked!');
          break;
      case 'refresh':
        await interaction.deferReply();
        const buttonResponse = `${interaction.customId} button clicked!`;
        await interaction.followUp({ content: buttonResponse, ephemeral: true });
          break;
      default:
        await interaction.deferReply();
        await interaction.followUp('Unknown button clicked.');
    }
  }

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'generate') {
    const userInput = interaction.options.getString('input');
    const numberOfImages = interaction.options.getInteger('number_of_images') || 1; // Default to 1 if not provided

    await interaction.deferReply();

    // First, check the job queue status
    const queueStatus = await checkJobQueue();
    
    if (queueStatus) {
      // Inform the user about the current queue status
      await interaction.followUp(`Current queue: ${queueStatus.running_size} running jobs. Processing might take some time.`);
    }
      // Continue from the 'generate' command
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
        image_number: numberOfImages ? numberOfImages : 1, // Default to 1 if no input
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

              // Create the first row of buttons
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
              );
              rows.push(row1);

              // Create the second row of buttons
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
                  .setStyle(ButtonStyle.Secondary),
              );
              rows.push(row2);

              // Add an additional row for the single refresh button
              const row3 = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('refresh')
                  .setLabel('Refresh')
                  .setStyle(ButtonStyle.Primary)
                  .setEmoji('🔄')
              );
              rows.push(row3);

               // Send the final images as attachments with the buttons
              const replyContent = `**${userInput}** - Generated Images:`;
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
  }
    // The /describe command
    else if (interaction.commandName === 'describe') {
      await interaction.deferReply();

      try {
        const imageAttachment = interaction.options.getAttachment('image'); // For uploaded image
        const imageUrl = interaction.options.getString('image_url'); // For image URL

        const formData = new FormData();
        if (imageAttachment) {
          try {
            // Download the image and create a buffer
            const imageResponse = await axios.get(imageAttachment.url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imageResponse.data, 'binary');
            
            // Append the buffer to the form-data
            formData.append('image', buffer, {
              filename: imageAttachment.name,
              contentType: imageAttachment.contentType,
            });
          } catch (downloadError) {
            console.error('Error downloading the image:', downloadError);
            await interaction.editReply('Failed to download the image.');
            return;
          }
        } else if (imageUrl) {
          // Handle the image URL as required by your API
          formData.append('image', imageUrl);
        }

        // API request to describe the image
        const describeResponse = await axios.post('http://127.0.0.1:8888/v1/tools/describe-image', formData, {
          headers: {
            ...formData.getHeaders(),
            'accept': 'application/json'
          }
        });

        const description = describeResponse.data.describe;
        await interaction.editReply(`Image description: ${description}`);
      } catch (error) {
        console.error('Error in image description:', error);
        await interaction.editReply('Failed to describe the image.');
      }
    }

// End of interactionCreate event
});

// Login the bot
client.login(process.env.DISCORD_TOKEN);

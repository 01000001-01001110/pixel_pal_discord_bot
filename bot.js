import FormData from 'form-data';
import { 
  Client,
  GatewayIntentBits,
} from 'discord.js';
import { 
  generateCommand, 
  getImageUrlByIndex 
} from './generateImage.js'; 
import describeCommand from './describeCommand.js'; 
import { upscaleImage } from './upscaleCommand.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { varyImage } from './varyImage.js'; // Add this import
import { regenerateImages } from './regenerateImages.js';
import { aboutCommand } from './aboutCommand.js';

dotenv.config();

global.lastPrompts = {};

global.prompts = {};

global.imageUrls = {};

// Example function to re-initiate the generation process for the "refresh" action
async function refreshGenerationProcess(interaction, promptDetails) {
  // Extract details from promptDetails object
  const { prompt, styleSelections, aspectRatio, imageNumber, sharpness, guidanceScale, baseModelName } = promptDetails;

  // Assuming you have a function to initiate image generation that accepts these parameters directly
  try {
    const response = await initiateImageGeneration({
      prompt: prompt,
      styleSelections: styleSelections,
      aspectRatio: aspectRatio,
      imageNumber: imageNumber,
      sharpness: sharpness,
      guidanceScale: guidanceScale,
      baseModelName: baseModelName
      // Add other parameters as needed
    });

    // Process response and send results to the user
    // This might include sending the generated images, updating the interaction, etc.
    // Adjust according to how you handle successful generation and sending results back to the user
    if (response.success) {
      // Example of sending a success message with generated images
      const files = response.images.map(url => new AttachmentBuilder(url, { name: 'generated-image.png' }));
      await interaction.editReply({ content: 'Refreshed image generation complete.', files: files });
    } else {
      // Handle generation failure
      await interaction.editReply('Failed to refresh image generation.');
    }
  } catch (error) {
    console.error('Error in refreshing image generation:', error);
    await interaction.editReply('Error occurred during refreshed image generation.');
  }
}

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
    const interactionId = interaction.message.interaction.id; // Get the ID of the original interaction
    let imageUrl;

    if (['U1', 'U2', 'U3', 'U4'].includes(interaction.customId)) {
      const imageIndex = parseInt(interaction.customId[1]) - 1;
      imageUrl = getImageUrlByIndex(interactionId, imageIndex);

      if (imageUrl) {
        // Call upscaleImage function for U1-U4 buttons
        await interaction.deferReply({ ephemeral: true });
        await upscaleImage(interaction, imageUrl);
      } else {
        interaction.reply({ content: "Image not found.", ephemeral: true });
      }
    } else if (['V1', 'V2', 'V3', 'V4'].includes(interaction.customId)) {
      // Apply a "slight" variation for V1-V4 buttons
      const imageIndex = parseInt(interaction.customId[1]) - 1;
      imageUrl = getImageUrlByIndex(interactionId, imageIndex);

      if (imageUrl) {
        await interaction.deferReply({ ephemeral: true });
        await varyImage(interaction, imageUrl, "slight"); // Use "slight" variation
      } else {
        interaction.reply({ content: "Image not found.", ephemeral: true });
      }
    } if (interaction.customId === 'refresh') {
      const originalInteractionId = interaction.message.interaction.id;
      const prompt = global.prompts[originalInteractionId];
  
      if (prompt) {
          await interaction.deferReply({ ephemeral: true });
          await regenerateImages(interaction, prompt);
      } else {
          await interaction.reply({ content: "Unable to refresh. Original prompt not found.", ephemeral: true });
      }
  } 
  } else if (interaction.isChatInputCommand()) {
    if (!interaction.deferred && !interaction.replied) {
      if (interaction.commandName === 'generate') {
          await generateCommand(interaction, checkJobQueue);
      } else if (interaction.commandName === 'describe') {
          await describeCommand(interaction);
      } else if (interaction.commandName === 'upscale') {
          const imageAttachment = interaction.options.getAttachment('image'); // For uploaded image
          const imageUrl = interaction.options.getString('image_url'); // For image URL

          // Validate the input before proceeding
          if (imageAttachment && imageUrl) {
              await interaction.reply({ content: 'Please provide either an image attachment or a URL, but not both.', ephemeral: true });
              return;
          } else if (!imageAttachment && !imageUrl) {
              await interaction.reply({ content: 'Please provide an image attachment or a URL.', ephemeral: true });
              return;
          }

          // Determine the source of the image to upscale
          const imageSource = imageAttachment ? imageAttachment.url : imageUrl;
          await interaction.deferReply({ ephemeral: true });
          await upscaleImage(interaction, imageSource);
      } else if (interaction.commandName === 'vary') {
        const imageAttachment = interaction.options.getAttachment('image');
        const imageUrl = interaction.options.getString('image_url');
        const variationType = interaction.options.getString('variation_type'); // Assume you've added a string option to command
    
        // Validate input
        if (!imageAttachment && !imageUrl) {
            await interaction.reply({ content: 'Please provide an image.', ephemeral: true });
            return;
        }
    
        const imageSource = imageAttachment ? imageAttachment.url : imageUrl;
    
        // Call varyImage with the validated image source and variation type
        await varyImage(interaction, imageSource, variationType);
      } else if (interaction.commandName === 'about') {
      await aboutCommand(interaction);
  }
      // Add else if blocks for other commands as needed
  }
}
});
// Login the bot
client.login(process.env.DISCORD_TOKEN);

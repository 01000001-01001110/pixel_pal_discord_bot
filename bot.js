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

dotenv.config();

global.imageUrls = {};

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
              // Directly call upscaleImage with the imageUrl
              // Note: Interaction reply or defer is handled within upscaleImage
              upscaleImage(interaction, imageUrl);
          } else {
              // Reply directly if image URL is not found, no need to defer in this case
              interaction.reply({ content: "Image not found.", ephemeral: true });
          }
      } else if (['V1', 'V2', 'V3', 'V4', 'refresh'].includes(interaction.customId)) {
          // Handle other buttons like variations or refresh
          console.log(`${interaction.customId} button clicked`);
          interaction.followUp({ content: `${interaction.customId} button action is being processed.`, ephemeral: true });
      } else {
          // Handle unknown button clicks
          interaction.reply({ content: 'Unknown button clicked.', ephemeral: true });
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
      }
      // Add else if blocks for other commands as needed
  }
}
});
// Login the bot
client.login(process.env.DISCORD_TOKEN);

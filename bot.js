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
import upscaleImage from './upscaleCommand.js';
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
    let imageIndex;
    switch (interaction.customId) {
      case 'U1':
        imageIndex = 0;
        break;
      case 'U2':
        imageIndex = 1;
        break;
      case 'U3':
        imageIndex = 2;
        break;
      case 'U4':
        imageIndex = 3;
        break;
      case 'V1':
      case 'V2':
      case 'V3':
      case 'V4':
      case 'refresh':
        // Log for debugging; replace with actual handling logic
        console.log(`${interaction.customId} button clicked`);
        await interaction.followUp({ content: `${interaction.customId} button action is being processed.`, ephemeral: true });
        break;
      default:
        await interaction.followUp('Unknown button clicked.');
    }

    if (['U1', 'U2', 'U3', 'U4'].includes(interaction.customId)) {
      await interaction.deferReply({ ephemeral: true });
      await upscaleImage(interaction, imageIndex);
    }

  } else if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'generate') {
      await generateCommand(interaction, checkJobQueue);
    } else if (interaction.commandName === 'describe') {
      await describeCommand(interaction);
    }
    // Add else if blocks for other commands as needed
  }
});

// Login the bot
client.login(process.env.DISCORD_TOKEN);

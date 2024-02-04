import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.CLIENT_ID;
const token = process.env.DISCORD_TOKEN;

const commands = [
  {
    name: 'generate',
    description: 'Generates an image based on input',
    options: [
      {
        type: 3, // STRING type for input
        name: 'input',
        description: 'The input to generate an image from',
        required: true,
      },
    ],
  },
  {
    name: 'describe',
    description: 'Describes an uploaded image or an image from a URL',
    options: [
      {
        type: 11, // ATTACHMENT for image upload
        name: 'image',
        description: 'Upload an image to describe',
        required: false,
      },
      {
        type: 3, // STRING for image URL
        name: 'image_url',
        description: 'Enter an image URL to describe',
        required: false,
      },
    ],
  },
  {
    name: 'upscale',
    description: 'Upscales an uploaded image or an image from a URL',
    options: [
      {
        type: 11, // ATTACHMENT for image upload
        name: 'image',
        description: 'Upload an image to upscale',
        required: false,
      },
      {
        type: 3, // STRING for image URL
        name: 'image_url',
        description: 'Enter an image URL to upscale',
        required: false,
      },
    ],
  },
  {
    name: 'vary',
    description: 'Applies a variation to an uploaded image or an image from a URL',
    options: [
      {
        type: 3, // STRING for selecting the variation type
        name: 'variation_type',
        description: 'Choose the type of variation: slight or strong',
        required: true,
        choices: [
          {
            name: 'slight',
            value: 'slight',
          },
          {
            name: 'strong',
            value: 'strong',
          },
        ],
      },
      {
        type: 11, // ATTACHMENT for image upload
        name: 'image',
        description: 'Upload an image to vary',
        required: false,
      },
      {
        type: 3, // STRING for image URL
        name: 'image_url',
        description: 'Enter an image URL to vary',
        required: false,
      },
    ],
  }
];
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

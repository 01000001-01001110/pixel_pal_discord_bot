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
        type: 3, // Type 3 is 'STRING'
        name: 'input',
        description: 'The input to generate an image from',
        required: true
      },
      {
        type: 4, // Type 4 is 'INTEGER'
        name: 'number_of_images',
        description: 'The number of images to generate',
        required: false // Set to true if you want it to be a mandatory field
      }
    ]
  },
  {
    name: 'describe',
    description: 'Describes an image',
    options: [
      {
        type: 11, // Type 11 is 'ATTACHMENT'
        name: 'image',
        description: 'Upload an image to describe',
        required: false
      },
      {
        type: 3, // Type 3 is 'STRING'
        name: 'image_url',
        description: 'Enter an image URL to describe',
        required: false
      }
    ]
  }
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

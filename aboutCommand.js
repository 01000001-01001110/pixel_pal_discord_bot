// aboutCommand.js
import { EmbedBuilder } from 'discord.js';

const aboutCommand = async (interaction) => {
    const userName = interaction.user.username; // Get the user's name from the interaction
    const iconUrl = "https://cdn.discordapp.com/attachments/1193193932180426873/1203430214252634143/inet0_2d_image_flat_logo_Letters_Pixel_Pal_background_multicolo_c49c973c-1b06-48ab-aa75-cb6e5c00e062.png";

    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle(`Hello, ${userName}, digital artist!`)
        .setDescription(`I am Pixel Pal, a Discord bot designed to enhance your digital art experience. Here's what I can do for you:`)
        .setThumbnail(iconUrl) // Sets the thumbnail to the embed
        .addFields(
            { name: 'Generate', value: 'Generate images from text prompts.' },
            { name: 'Describe', value: 'Describe the content of images.' },
            { name: 'Upscale', value: 'Enhance the resolution of images.' },
            { name: 'Vary', value: 'Apply variations to images for slight or strong effects.' },
            { name: 'Refresh', value: 'Regenerate images with the same prompts for new perspectives.' },
            { name: 'About', value: 'Displays information about me and what I can do.' },
            { name: 'Changelog', value: `
- **Initial Setup**: Foundation and Discord API integration.
- **Upscale Feature**: Image resolution enhancement.
- **Error Handling Improvements**: Better user feedback on errors.
- **Variation Feature**: "Slight" and "strong" image variations added.
- **Refresh Mechanism**: Image regeneration with the same prompt.
- **Command Registration**: Streamlined process for new commands.
- **About Command**: Added, with personalized greeting and bot overview.
- **Modularization**: Improved code structure for easy maintenance.
            ` }
        )
        .setFooter({ text: 'Here to make your digital art creation process smoother and more fun!' });

    // Use ephemeral: true to make the reply only visible to the user
    await interaction.reply({ embeds: [embed], ephemeral: true });
};

export { aboutCommand };

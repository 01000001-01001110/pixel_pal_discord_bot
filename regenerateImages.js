// regenerateImages.js
import axios from 'axios';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import { createButtonRows } from './generateImage.js'; // Assuming you have a utility function to create button rows

/**
 * Regenerates images based on the given prompt and updates the interaction.
 * @param {Interaction} interaction - The Discord interaction object.
 * @param {string} prompt - The prompt used for generating images.
 */
async function regenerateImages(interaction, prompt) {
    // Example request to your image generation API
    try {
        const response = await axios.post('http://127.0.0.1:8888/v1/generation/text-to-image', {
            prompt: prompt,
            // Additional parameters as needed
        });

        // Assuming the response includes URLs to the generated images
        const images = response.data.images; // Adapt based on actual response structure

        // Create an array of AttachmentBuilder objects for each image URL
        const attachments = images.map(url => new AttachmentBuilder(url, { name: 'generated-image.png' }));

        // Create button rows for the new images
        const components = createButtonRows(); // Adapt this call to your utility function

        // Update the interaction with the new images and buttons
        await interaction.editReply({
            content: 'Here are your refreshed images:',
            files: attachments,
            components: components,
        });
    } catch (error) {
        console.error('Error regenerating images:', error);
        await interaction.editReply('Failed to regenerate images. Please try again later.');
    }
}

export { regenerateImages };

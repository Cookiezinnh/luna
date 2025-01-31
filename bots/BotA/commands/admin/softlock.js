const { SlashCommandBuilder } = require('discord.js');
const SoftLock = require('../../models/softlock');
const RoleConfig = require('../../models/roleConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('softlock')
        .setDescription('Impede temporariamente um usuário de participar das atividades do servidor.')
        .addStringOption(option =>
            option.setName('usuario')
                .setDescription('Usuário ou ID do usuário a ser softlockado.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo para aplicar o softlock.')
                .setRequired(true)),
    commandAlias: ['lockuser', 'userlock', 'pruneuser', 'userprune', 'prune'],
    requiredRoles: ['ADMIN', 'MODERATOR'],
    supportsPrefix: true,

    async execute(context, args) {
        const isInteraction = context.isCommand?.();
        let guild, options;

        if (isInteraction) {
            guild = context.guild;
            options = context.options;
        } else {
            guild = context.guild;
            options = args;
        }

        const targetInput = isInteraction
            ? options.getString('usuario')
            : args[0];

        const reason = isInteraction
            ? options.getString('motivo')
            : args.slice(1).join(' ');

        try {
            const roleConfig = await RoleConfig.findOne({ roleName: 'SOFTLOCKED_ROLE', guildId: guild.id });
            if (!roleConfig) {
                const replyMessage = ':x: O cargo "Softlock" não foi configurado no banco de dados.';
                return isInteraction
                    ? context.reply({ content: replyMessage, ephemeral: true })
                    : context.channel.send(replyMessage);
            }

            const softlockRole = guild.roles.cache.get(roleConfig.roleId);

            const targetId = targetInput?.replace(/[^0-9]/g, '');
            let member = null;

            // Tentar buscar o membro no servidor
            try {
                member = await guild.members.fetch(targetId);
            } catch {
                console.warn(`[SoftLock Command] Usuário ${targetId} não encontrado no servidor.`);
            }

            if (member && softlockRole) {
                // Aplicar softlock ao membro presente no servidor
                await member.roles.add(softlockRole);
            }

            // Registrar o usuário no banco de dados mesmo que ele não esteja no servidor
            const existingRecord = await SoftLock.findOne({ guildId: guild.id, userId: targetId });
            if (!existingRecord) {
                await SoftLock.create({ guildId: guild.id, userId: targetId });
            }

            const successMessage = `✅ Usuário ${member?.user?.tag || targetId} foi softlockado. Motivo: ${reason}`;
            return isInteraction
                ? context.reply({ content: successMessage, ephemeral: false })
                : context.channel.send(successMessage);
        } catch (error) {
            console.error('[SoftLock Command] Erro ao aplicar softlock:', error);
            const errorMessage = ':x: Ocorreu um erro ao tentar aplicar o softlock.';
            return isInteraction
                ? context.reply({ content: errorMessage, ephemeral: true })
                : context.channel.send(errorMessage);
        }
    },
};
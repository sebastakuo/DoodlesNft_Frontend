import { AttributeConfig, GlobalAttributeConfig } from './models';

export const MAX_MODIFICATIONS = 4;

export const ATTRIBUTE_CONFIG: AttributeConfig[] = [
    { key: 'background', label: 'Background', defaultPrompt: 'Same background' },
    { key: 'skinType', label: 'Skin Type', defaultPrompt: 'Same skin type' },
    { key: 'clothing', label: 'Clothing', defaultPrompt: 'Same clothing' },
    { key: 'head', label: 'Head', defaultPrompt: 'Same head' },
    { key: 'eyes', label: 'Eyes', defaultPrompt: 'Same eyes' },
    { key: 'mouth', label: 'Mouth', defaultPrompt: 'Same mouth' },
    { key: 'accessory', label: 'Accessory', defaultPrompt: 'Same accessory' }
];

export const GLOBAL_ATTRIBUTE_CONFIG: GlobalAttributeConfig[] = [
     { key: 'character', label: 'Character', defaultPrompt: 'Same character, identical features, and build' },
     { key: 'pose', label: 'Pose', defaultPrompt: 'Same pose, direction, and zoom' },
     { key: 'style', label: 'Art Style', defaultPrompt: 'Identical art style' }
];

// Hedera Namespace para WalletConnect/Reown
export const HEDERA_NAMESPACE = {
    hedera: {
        // Formato CAIP-2 soportado por WalletConnect: 'namespace:chainId'
        // Permitimos varias redes para que el wallet liste cualquier cuenta disponible.
        chains: ['hedera:testnet', 'hedera:mainnet', 'hedera:previewnet'],
        methods: [
            'hedera_getBalance',
            'hedera_signTransaction',
            'hedera_sendTransaction',
            'hedera_signMessage',
        ],
        events: ['accountsChanged', 'chainChanged'],
    },
};

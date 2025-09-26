import { Injectable } from '@angular/core';
import SignClient from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';
import { environment } from '../environments/environment';
import { HEDERA_NAMESPACE } from '../config';

@Injectable({ providedIn: 'root' })
export class WalletConnectService {
  private client!: SignClient;
  private modal!: WalletConnectModal;

  async init() {
    if (!environment.walletConnect?.projectId) {
      console.error('WalletConnect projectId no está definido en environment.');
    }

    this.client = await SignClient.init({
      projectId: environment.walletConnect.projectId,
      metadata: {
        name: 'Angular Hedera dApp',
        description: 'Demo con HashPack/Kabila',
        url: window.location.origin,
        icons: [],
      },
    });

    this.modal = new WalletConnectModal({
      projectId: environment.walletConnect.projectId,
      themeMode: 'dark',
      explorerRecommendedWalletIds: environment.walletConnect.recommendedWalletIds,
      enableExplorer: true,
    });
  }

  async connect() {
    console.log('🔗 Abriendo modal Reown (WalletConnect Modal)...');

    const requiredNamespaces = {
      hedera: {
        chains: HEDERA_NAMESPACE.hedera.chains, // ['hedera:testnet']
        methods: HEDERA_NAMESPACE.hedera.methods,
        events: HEDERA_NAMESPACE.hedera.events,
      },
    } as const;

    const { uri, approval } = await this.client.connect({ requiredNamespaces });

    if (uri) {
      await this.modal.openModal({ uri });
    }

    try {
      const session = await approval();
      console.log('✅ Sesión establecida:', session);
      return session;
    } finally {
      this.modal.closeModal();
    }
  }

  getSessions() {
    const valuesFn = (this.client as any)?.session?.values;
    return typeof valuesFn === 'function' ? valuesFn.call((this.client as any).session) : [];
  }

  async disconnect(topic: string) {
    await this.client.disconnect({
      topic,
      reason: { code: 6000, message: 'USER_DISCONNECTED' },
    });
  }
}

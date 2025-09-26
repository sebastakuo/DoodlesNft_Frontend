import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { WalletConnectService } from '../../services/walletconnect.service';
import { HederaService } from '../../services/hedera.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css'],
})
export class WalletComponent implements OnInit {
  private wc = inject(WalletConnectService);
  private hederaService = inject(HederaService);
  private cdr = inject(ChangeDetectorRef);

  // Estados del componente
  isConnected = false;
  isConnecting = false;
  walletAddress = '';
  walletName = '';
  balance = '';
  error = '';

  async ngOnInit() {
    console.log('🚀 Inicializando WalletComponent...');
    await this.wc.init();
    this.checkExistingConnection();
    console.log('🔄 Estados iniciales - isConnected:', this.isConnected, 'isConnecting:', this.isConnecting);
  }

  private checkExistingConnection() {
    console.log('🔍 Verificando conexiones existentes...');
    const sessions = this.wc.getSessions();
    console.log('📋 Sesiones existentes:', sessions);
    
    if (sessions.length > 0) {
      const session = sessions[0];
      console.log('📋 Primera sesión:', session);
      // Extraer la dirección de la cuenta desde los namespaces
      const accounts = this.extractAccountsFromSession(session);
      console.log('📋 Cuentas encontradas:', accounts);
      
      if (accounts.length > 0) {
        // El formato de la cuenta es 'hedera:testnet:0.0.xxxxx' o similar
        this.walletAddress = this.extractAccountId(accounts[0]);
        this.walletName = this.detectWalletName(session);
        console.log('✅ Conexión existente detectada:', this.walletName, '-', this.walletAddress);
        this.isConnected = true;
        this.cdr.detectChanges(); // Forzar actualización inmediata
        this.loadBalance();
      }
    } else {
      console.log('ℹ️ No hay sesiones existentes');
    }
  }

  private extractAccountId(account: string): string {
    // Extraer el account ID desde el formato CAIP (ej: 'hedera:testnet:0.0.12345')
    const parts = account.split(':');
    // Retorna solo el ID de la cuenta (ej: '0.0.12345')
    return parts.length >= 3 ? parts.slice(2).join(':') : account;
  }

  private detectWalletName(session: any): string {
    // Detectar el nombre de la wallet desde los metadatos de la sesión
    const peerMetadata = session?.peer?.metadata;
    
    if (peerMetadata?.name) {
      const name = peerMetadata.name.toLowerCase();
      
      // Mapear nombres conocidos
      if (name.includes('hashpack')) return 'HashPack';
      if (name.includes('kabila')) return 'Kabila';
      if (name.includes('blade')) return 'Blade';
      if (name.includes('wallawallet')) return 'WallaWallet';
      
      // Si no es conocido, usar el nombre tal como viene
      return peerMetadata.name;
    }
    
    // Fallback genérico
    return 'Wallet';
  }

  private extractAccountsFromSession(session: any): string[] {
    const accounts: string[] = [];
    
    // Intentar diferentes formas de obtener las cuentas
    if (session?.namespaces?.hedera?.accounts) {
      accounts.push(...session.namespaces.hedera.accounts);
    }
    
    // Fallback: buscar en otros posibles namespaces
    if (accounts.length === 0 && session?.namespaces) {
      for (const [key, namespace] of Object.entries(session.namespaces)) {
        if (namespace && typeof namespace === 'object' && (namespace as any).accounts) {
          console.log(`📋 Cuentas encontradas en namespace '${key}':`, (namespace as any).accounts);
          accounts.push(...(namespace as any).accounts);
        }
      }
    }
    
    // Fallback final: buscar directamente en la sesión
    if (accounts.length === 0 && session?.accounts) {
      accounts.push(...session.accounts);
    }
    
    return accounts;
  }

  async connect() {
    if (this.isConnected) {
      await this.disconnect();
      return;
    }

    this.isConnecting = true;
    this.error = '';
    this.cdr.detectChanges(); // Forzar actualización inmediata

    try {
      console.log('🔗 Iniciando conexión...');
      const session = await this.wc.connect();
      
      const accounts = this.extractAccountsFromSession(session);
      console.log('📋 Cuentas extraídas:', accounts);
      
      if (accounts.length > 0) {
        const account = accounts[0];
        this.walletAddress = this.extractAccountId(account);
        this.walletName = this.detectWalletName(session);
        console.log('✅ Wallet conectado:', this.walletName, '-', this.walletAddress);
        this.isConnected = true;
        this.isConnecting = false; // Cambiar estado inmediatamente
        console.log('🔄 Estados después de conexión - isConnected:', this.isConnected, 'isConnecting:', this.isConnecting);
        this.cdr.detectChanges(); // Forzar actualización inmediata
        
        await this.loadBalance();
        this.cdr.detectChanges(); // Actualizar después de cargar balance
        
        console.log('✅ Conexión completada exitosamente - Estados finales - isConnected:', this.isConnected, 'isConnecting:', this.isConnecting);
      } else {
        console.warn('⚠️ No se encontraron cuentas en la sesión');
        console.log('📋 Estructura completa de la sesión:', JSON.stringify(session, null, 2));
        this.error = 'No se encontraron cuentas en la billetera';
        this.cdr.detectChanges(); // Actualizar para mostrar error
      }
    } catch (err: any) {
      this.error = err?.message || 'Error al conectar la billetera';
      console.error('❌ Error connecting wallet:', err);
      this.cdr.detectChanges(); // Actualizar para mostrar error
    } finally {
      if (!this.isConnected) {
        this.isConnecting = false;
      }
      console.log('🏁 Estados finales en finally - isConnected:', this.isConnected, 'isConnecting:', this.isConnecting);
      this.cdr.detectChanges(); // Actualización final
    }
  }

  private loadBalance() {
    if (this.walletAddress) {
      console.log('💰 Cargando balance para:', this.walletAddress);
      this.hederaService.getBalance(this.walletAddress).subscribe({
        next: (res) => {
          this.balance = res.balance;
          console.log('💰 Balance obtenido:', this.balance);
          this.cdr.detectChanges(); // Actualizar UI después de cargar balance
        },
        error: (err) => {
          console.error('❌ Error loading balance:', err);
          this.balance = 'Error al cargar';
          this.cdr.detectChanges(); // Actualizar UI en caso de error
        }
      });
    }
  }



  async disconnect() {
    try {
      console.log('🔌 Iniciando desconexión...');
      const sessions = this.wc.getSessions();
      if (sessions.length > 0) {
        await this.wc.disconnect(sessions[0].topic);
        console.log('✅ Sesión desconectada');
      }
      this.resetWalletState();
      this.cdr.detectChanges(); // Forzar actualización
      console.log('🔄 Estados después de desconexión - isConnected:', this.isConnected, 'isConnecting:', this.isConnecting);
    } catch (err) {
      console.error('❌ Error disconnecting:', err);
    }
  }

  private resetWalletState() {
    console.log('🔄 Reseteando estado de wallet...');
    this.isConnected = false;
    this.isConnecting = false; // Asegurar que también se resetee isConnecting
    this.walletAddress = '';
    this.walletName = '';
    this.balance = '';
    this.error = '';
    console.log('✅ Estado reseteado - isConnected:', this.isConnected, 'isConnecting:', this.isConnecting);
  }

  // Método para obtener el formato completo de wallet
  getWalletDisplayName(): string {
    if (!this.walletName || !this.walletAddress) return '';
    return `${this.walletName}: ${this.walletAddress}`;
  }

  // Método para refrescar el balance manualmente
  async refreshBalance() {
    await this.loadBalance();
    this.cdr.detectChanges(); // Forzar actualización después del refresh
  }

  // Método temporal para debug
  forceStateUpdate() {
    console.log('🔧 Forzando actualización de estado...');
    this.checkExistingConnection();
    this.cdr.detectChanges();
  }
}

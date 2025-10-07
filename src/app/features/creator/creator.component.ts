import { Component, ChangeDetectionStrategy, signal, computed, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { GeminiService } from '../../core/services/gemini.service';
import { AIAnalysisData, Attribute, GeneratedResult, AttributeConfig, GlobalAttributeConfig } from '../../models';
import { ATTRIBUTE_CONFIG, GLOBAL_ATTRIBUTE_CONFIG, MAX_MODIFICATIONS } from '../../../config';

@Component({
  selector: 'app-creator',
  templateUrl: './creator.component.html',
  styleUrls: ['./creator.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, HttpClientModule],
  host: {
    '(window:keydown)': 'handleKeyboardEvents($event)'
  }
})
export class CreatorComponent implements OnInit {
  private geminiService = inject(GeminiService);
  private cdr = inject(ChangeDetectorRef);

  // State Signals
  base64ImageData = signal<string | null>(null);
  baseImageURL = signal<string | null>(null);
  attributeReferences = signal<{ [key: string]: { base64: string; mimeType: string } }>({});
  aiAnalysisData = signal<AIAnalysisData | null>(null);
  generatedResults = signal<GeneratedResult[]>([]);
  isAnalyzing = signal(false);
  isGenerating = signal(false);
  toastMessage = signal<string | null>(null);
  modalImageIndex = signal<number | null>(null);
  showFloatingSuggestion = signal<boolean>(false);
  attributes = signal<Attribute[]>(this.initializeAttributes());
  variationCount = signal<number>(1);
  workingMode = signal<'full' | 'base'>('full'); // Modo de trabajo: full o base

  // Computed Signals
  isGenerateButtonDisabled = computed(() => !this.base64ImageData() || this.isGenerating());
  isAttributesCardDisabled = computed(() => !this.base64ImageData());
  modificationCount = computed(() => {
    const mode = this.workingMode();
    if (mode === 'base') {
      // En modo base, solo contar modificaciones de skin, eyes, mouth
      return this.attributes().filter(a => !a.isActive && ['skinType', 'eyes', 'mouth'].includes(a.key)).length;
    }
    return this.attributes().filter(a => !a.isActive).length;
  });
  showSmartTip = computed(() => this.modificationCount() >= MAX_MODIFICATIONS);
  maxModificationsAllowed = computed(() => {
    switch(this.workingMode()) {
      case 'full': return MAX_MODIFICATIONS;
      case 'base': return 3; // En modo base, máximo 3 (skin, eyes, mouth)
      default: return MAX_MODIFICATIONS;
    }
  });
  
  viewableResults = computed(() =>
    this.generatedResults().filter(r => r.imageUrl && !r.isLoading)
  );

  modalImageUrl = computed(() => {
    const index = this.modalImageIndex();
    const results = this.viewableResults();
    if (index !== null && index >= 0 && index < results.length) {
      return results[index].imageUrl;
    }
    return null;
  });

  readonly MAX_MODIFICATIONS = MAX_MODIFICATIONS;

  private initializeAttributes(): Attribute[] {
    return ATTRIBUTE_CONFIG.map(config => ({
      ...config,
      isActive: true,
      promptValue: '',
      aiKeyword: '',
      referencePreviewUrl: null
    }));
  }

  showToast(message: string): void {
    // Limpiar timeout anterior si existe
    if ((this as any).toastTimeout) {
      clearTimeout((this as any).toastTimeout);
    }
    
    this.toastMessage.set(message);
    (this as any).toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
      (this as any).toastTimeout = null;
    }, 3000);
  }

  ngOnInit(): void {
    // Verificar si ya se mostró el mensaje flotante en esta sesión
    const suggestionShown = sessionStorage.getItem('suggestionShown');
    
    if (!suggestionShown) {
      // Mostrar el mensaje solo si no se ha mostrado en esta sesión
      this.showFloatingSuggestion.set(true);
      
      // Marcar como mostrado en esta sesión
      sessionStorage.setItem('suggestionShown', 'true');
      
      // Ocultar automáticamente después de 15 segundos
      setTimeout(() => {
        this.showFloatingSuggestion.set(false);
      }, 20000);
    }
  }

  closeSuggestion(): void {
    this.showFloatingSuggestion.set(false);
    sessionStorage.setItem('suggestionShown', 'true');
  }

  // --- File Handling ---

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.add('border-pink-500');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('border-pink-500');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('border-pink-500');
    if (event.dataTransfer?.files?.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.showToast("Please select an image file.");
      return;
    }
    
    // Validar estado antes de proceder
    if (this.isAnalyzing() || this.isGenerating()) {
      this.showToast("Please wait for the current operation to finish.");
      return;
    }
    
    // Limpiar estado anterior
    this.aiAnalysisData.set(null);
    this.isAnalyzing.set(false);
    
    // Mostrar mensaje de optimización
    this.showToast("🔄 Optimizando imagen para análisis...");
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      this.baseImageURL.set(imageUrl);
      
      try {
        // Comprimir imagen para análisis más rápido
        const compressedBase64 = await this.compressImage(file, 1024, 0.8);
        this.base64ImageData.set(compressedBase64.split(',')[1]);
        await this.runImageAnalysis();
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback a imagen original si la compresión falla
        this.base64ImageData.set(imageUrl.split(',')[1]);
        await this.runImageAnalysis();
      }
      
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  private compressImage(file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convertir a base64 comprimido
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // --- AI Analysis ---

  private analysisPromise: Promise<void> | null = null;

  async runImageAnalysis(): Promise<void> {
    // Prevenir análisis simultáneos
    if (this.analysisPromise) {
      return this.analysisPromise;
    }

    const base64 = this.base64ImageData();
    if (!base64) return;

    this.analysisPromise = this.performAnalysis(base64);
    
    try {
      await this.analysisPromise;
    } finally {
      this.analysisPromise = null;
    }
  }

  private async performAnalysis(base64: string): Promise<void> {
    // Siempre resetear estado antes de iniciar
    this.isAnalyzing.set(false);
    
    // Pequeño delay para que la UI se actualice
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.isAnalyzing.set(true);
    this.cdr.detectChanges();

    // Mostrar progreso paso a paso
    const progressTimeout1 = setTimeout(() => {
      if (this.isAnalyzing()) {
        this.showToast('🤖 Analizando con IA... Esto puede tomar 30-60 segundos');
      }
    }, 3000);

    const progressTimeout2 = setTimeout(() => {
      if (this.isAnalyzing()) {
        this.showToast('⏳ Análisis avanzado en progreso... Casi terminando');
      }
    }, 15000);

    try {
      const analysis = await this.geminiService.analyzeImage(base64).toPromise();
      const aiResult = analysis?.result ?? analysis;
      this.aiAnalysisData.set(aiResult);
      this.updateAttributeKeywords(aiResult);
      this.showToast("✅ ¡Análisis completado con éxito!");
    } catch (error) {
      console.error("Image analysis failed:", error);
      this.showToast("❌ Error en análisis. Intenta con una imagen más pequeña.");
    } finally {
      // Limpiar timeouts
      clearTimeout(progressTimeout1);
      clearTimeout(progressTimeout2);
      
      // Siempre resetear en finally
      this.isAnalyzing.set(false);
      this.cdr.detectChanges();
    }
  }

  private updateAttributeKeywords(analysis: AIAnalysisData): void {
    const mapping: { [key: string]: string } = {
        background: analysis.backgroundDescription,
        skinType: analysis.skinTypeDescription,
        clothing: analysis.clothingDescription,
        head: analysis.headDescription,
        eyes: analysis.eyesDescription,
        mouth: analysis.mouthDescription,
        accessory: analysis.accessoryDescription
    };
    this.attributes.update(attrs =>
      attrs.map(attr => ({ ...attr, aiKeyword: mapping[attr.key]?.replace(/"/g, '') || 'N/A' }))
    );
  }
  
  getGlobalAttributeDescription(key: string): string {
    const data = this.aiAnalysisData();
    if (!data) return 'N/A';
    switch (key) {
      case 'character': return data.characterDescription;
      case 'pose': return data.poseDescription;
      case 'style': return data.styleDescription;
      default: return 'N/A';
    }
  }

  // --- Attribute Management ---

  private restoreAttributesWithAIKeywords(): void {
    // Restaurar atributos con las palabras clave de IA si existe análisis
    this.attributes.set(this.initializeAttributes());
    const analysis = this.aiAnalysisData();
    if (analysis) {
      this.updateAttributeKeywords(analysis);
    }
  }

  setWorkingMode(mode: 'full' | 'base'): void {
    if (this.isGenerating() || this.isAnalyzing()) {
      return;
    }
    
    const previousMode = this.workingMode();
    this.workingMode.set(mode);
    
    // Siempre limpiar referencias al cambiar de modo para evitar conflictos
    this.attributeReferences.set({});
    
    // Configurar atributos según el modo
    if (mode === 'base') {
      // En modo base: solo permitir modificar skin, eyes, mouth
      // Primero restaurar atributos y luego configurar según el modo base
      this.restoreAttributesWithAIKeywords();
      this.attributes.update(attrs =>
        attrs.map(attr => {
          if (['skinType', 'eyes', 'mouth'].includes(attr.key)) {
            // Estos atributos pueden ser modificados, mantener AI keyword
            return { ...attr, isActive: true, promptValue: '' };
          } else if (attr.key === 'background') {
            // Background se fija a blanco neutral
            return { ...attr, isActive: false, promptValue: 'neutral white background' };
          } else if (attr.key === 'clothing') {
            // Clothing se fija a esqueleto blanco
            return { ...attr, isActive: false, promptValue: 'plain white tank top, minimal clean design' };
          } else {
            // Otros atributos se fijan como N/A
            return { ...attr, isActive: false, promptValue: 'bald, scale and proportion of proper head, clean minimal style' };
          }
        })
      );
    } else if (mode === 'full') {
      // En modo full, siempre restaurar completamente
      this.restoreAttributesWithAIKeywords();
    }
  }

  toggleAttribute(key: string): void {
    const currentAttr = this.attributes().find(a => a.key === key);
    const isDeactivating = currentAttr?.isActive;
    const maxAllowed = this.maxModificationsAllowed();
    const currentModificationCount = this.modificationCount();
    const mode = this.workingMode();
    
    // En modo base, solo permitir modificar skin, eyes, mouth
    if (mode === 'base' && !['skinType', 'eyes', 'mouth'].includes(key)) {
      this.showToast('Base Character mode only allows modifying Skin Type, Eyes, and Mouth');
      return;
    }
    
    // Si estamos intentando desactivar (modificar) un atributo
    if (isDeactivating) {
      // Verificar límites para otros casos
      if (currentModificationCount >= maxAllowed) {
        let modeText = '';
        switch(mode) {
          case 'base':
            modeText = 'Base Character mode allows only 3 modifications (Skin, Eyes, Mouth)';
            break;
          default:
            modeText = `For best results, please modify only ${maxAllowed} attributes at a time`;
        }
        this.showToast(modeText);
        return;
      }
    }
    
    // Comportamiento normal de toggle
    this.attributes.update(attrs =>
      attrs.map(attr => attr.key === key ? { ...attr, isActive: !attr.isActive } : attr)
    );
  }
  
  updateAttributePrompt(key: string, event: Event): void {
      const value = (event.target as HTMLInputElement).value;
      this.attributes.update(attrs => 
        attrs.map(attr => attr.key === key ? { ...attr, promptValue: value } : attr)
      );
  }

  async onReferenceFileSelected(event: Event, key: string): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
       if (!file.type.startsWith('image/')) {
        this.showToast("Please select an image file for reference.");
        input.value = '';
        return;
      }
      try {
        const { resizedUrl, resizedBase64 } = await this.resizeImage(file, 1024, 1024);
        
        this.attributeReferences.update(refs => ({
          ...refs,
          [key]: { base64: resizedBase64, mimeType: file.type }
        }));

        this.attributes.update(attrs => 
            attrs.map(attr => attr.key === key ? { ...attr, referencePreviewUrl: resizedUrl } : attr)
        );
        this.cdr.detectChanges();
      } catch (error) {
        console.error("Failed to resize image:", error);
        this.showToast("Could not process reference image.");
      } finally {
        input.value = ''; // Reset input
      }
    }
  }

  private resizeImage(file: File, width: number, height: number): Promise<{resizedUrl: string, resizedBase64: string}> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result) {
          return reject(new Error('FileReader did not return a result.'));
        }
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Could not get canvas context'));
          }
          ctx.drawImage(img, 0, 0, width, height);
          const resizedUrl = canvas.toDataURL(file.type);
          const resizedBase64 = resizedUrl.split(',')[1];
          resolve({resizedUrl, resizedBase64});
        };
        img.onerror = (err) => reject(err);
        img.src = e.target.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  deleteReference(key: string): void {
    this.attributeReferences.update(refs => {
      const newRefs = { ...refs };
      delete newRefs[key];
      return newRefs;
    });
    this.attributes.update(attrs => 
      attrs.map(attr => attr.key === key ? { ...attr, referencePreviewUrl: null } : attr)
    );
  }

  setVariationCount(count: number): void {
    if (!this.isGenerating()) {
      this.variationCount.set(count);
    }
  }

  // --- Image Generation ---

  async onGenerateClick(): Promise<void> {
    if (!this.base64ImageData()) {
      this.showToast("Please upload a base image first.");
      return;
    }
    
    for (const attr of this.attributes()) {
      if (!attr.isActive) { // This attribute is being modified
        const hasTextPrompt = attr.promptValue.trim().length > 0;
        
        if (!hasTextPrompt) {
          this.showToast(`Please describe the change for '${attr.label}'. The text field cannot be empty for modified attributes.`);
          return;
        }
      }
    }

    this.isGenerating.set(true);
    this.cdr.detectChanges();

    try {
      const count = this.variationCount();
      const newResults: GeneratedResult[] = Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        isLoading: true,
      }));
      this.generatedResults.update(results => [...newResults, ...results]);
      this.cdr.detectChanges();

      const parts = this.constructFinalParts();
      
      // Process generations sequentially to avoid rate limiting
      for (const result of newResults) {
        try {
          const response = await this.geminiService.generateImage(parts).toPromise();
          const imageUrl = `data:image/png;base64,${response.image}`;
          this.generatedResults.update(results =>
            results.map(r => r.id === result.id ? { ...r, isLoading: false, imageUrl } : r)
          );
          // Guardar en la librería (localStorage)
          try {
            const key = 'libreriaImagenes';
            const actuales = JSON.parse(localStorage.getItem(key) || '[]');
            if (!actuales.includes(imageUrl)) {
              actuales.unshift(imageUrl);
              localStorage.setItem(key, JSON.stringify(actuales.slice(0, 50)));
            }
          } catch (e) { /* ignorar errores de almacenamiento */ }
        } catch (error) {
          const errorMessage = (error as Error).message || 'Failed to generate image';
          console.error("Image generation failed:", error);
          this.generatedResults.update(results =>
            results.map(r => r.id === result.id ? { ...r, isLoading: false, error: errorMessage } : r)
          );
        }
        this.cdr.detectChanges();
      }
    } finally {
      this.isGenerating.set(false);
      this.cdr.detectChanges();
    }
  }

  /**
   * Sets a generated image as the new base image for further modifications.
   * @param imageUrl The data URL of the image to set as the new base.
   */
  async selectAsBaseImage(imageUrl: string): Promise<void> {
    if (this.isGenerating() || this.isAnalyzing()) {
      this.showToast('Please wait for the current operation to finish.');
      return;
    }

    // Limpiar completamente el estado anterior
    this.isAnalyzing.set(false);
    this.aiAnalysisData.set(null); // Limpiar análisis anterior
    
    // Mostrar mensaje de optimización
    this.showToast("🔄 Optimizando imagen para análisis...");
    
    try {
      // Convertir data URL a blob para poder comprimirla
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Crear un File object desde el blob
      const file = new File([blob], 'generated-image.png', { type: 'image/png' });
      
      // Comprimir la imagen usando la misma función que handleFile
      const compressedBase64 = await this.compressImage(file, 1024, 0.8);
      
      // Set the compressed image
      this.baseImageURL.set(imageUrl); // Mostrar la original en UI
      this.base64ImageData.set(compressedBase64.split(',')[1]); // Usar comprimida para análisis
      
    } catch (error) {
      console.error('Error compressing selected image:', error);
      // Fallback a imagen original si la compresión falla
      this.baseImageURL.set(imageUrl);
      this.base64ImageData.set(imageUrl.split(',')[1]);
    }

    // Reset all attributes to their default state (sin AI keywords inicialmente)
    this.attributes.set(this.initializeAttributes());
    
    // Reset working mode to full
    this.workingMode.set('full');
    
    // Clear any previously uploaded reference images
    this.attributeReferences.set({});
    
    this.cdr.detectChanges();
    
    // Scroll to the top to see the new base image in the uploader
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger a new analysis on the new base image, which will also update AI keywords
    await this.runImageAnalysis();
  }
  
  // --- Modal Navigation ---
  
  openModal(imageUrl: string): void {
    const results = this.viewableResults();
    const index = results.findIndex(r => r.imageUrl === imageUrl);
    if (index > -1) {
      this.modalImageIndex.set(index);
    }
  }

  closeModal(): void {
    this.modalImageIndex.set(null);
  }

  nextModalImage(): void {
    const index = this.modalImageIndex();
    const total = this.viewableResults().length;
    if (index !== null && total > 1) {
      this.modalImageIndex.set((index + 1) % total);
    }
  }

  prevModalImage(): void {
    const index = this.modalImageIndex();
    const total = this.viewableResults().length;
    if (index !== null && total > 1) {
      this.modalImageIndex.set((index - 1 + total) % total);
    }
  }
  
  handleKeyboardEvents(event: KeyboardEvent): void {
    if (this.modalImageUrl()) { // Check if modal is open
      if (event.key === 'ArrowRight') {
        this.nextModalImage();
      } else if (event.key === 'ArrowLeft') {
        this.prevModalImage();
      } else if (event.key === 'Escape') {
        this.closeModal();
      }
    }
  }

  private constructFinalPrompt(): string {
    const analysis = this.aiAnalysisData();
    if (!analysis) {
      return 'Generate an image based on the provided base image, applying user modifications.';
    }

    const coreRules = `**PART 1: NON-NEGOTIABLE CORE RULES (HIGHEST PRIORITY)**
- **RULE 1: CHARACTER IDENTITY:** You MUST maintain the EXACT same character from the base image. For context, it is described as: "${analysis.characterDescription}". Do not change its species, build, or core features.
- **RULE 2: POSE & COMPOSITION:** You MUST replicate the EXACT same pose and composition from the base image. For context, the pose is: "${analysis.poseDescription}".
- **RULE 3: ART STYLE:** You MUST replicate the EXACT same art style from the base image, including line work, coloring, and shading. For context, the style is: "${analysis.styleDescription}".`;

    const attributesToMaintain: string[] = [];
    const attributesToModify: string[] = [];

    this.attributes().forEach(attr => {
        const isModified = !attr.isActive;
        const hasTextPrompt = attr.promptValue.trim().length > 0;
        const hasReference = !!this.attributeReferences()[attr.key];

        if (isModified && (hasTextPrompt || hasReference)) {
            let modificationInstruction = `**TASK for '${attr.label}':** `;
            const promptText = attr.promptValue.trim();

            if (['eyes', 'mouth'].includes(attr.key)) {
                modificationInstruction += `Strictly maintain the base character's style for this attribute, but modify its expression or appearance. Confine this change ONLY to the '${attr.label}' area.`;
            } else {
                modificationInstruction += `HIGH PRIORITY: Completely ignore and redraw the '${attr.label}' attribute. Your task is to replace it entirely. Confine this change ONLY to the '${attr.label}' area and ensure it does not bleed into other attributes.`;
            }
            
            if (hasTextPrompt) {
                 modificationInstruction += ` The new attribute should be: "${promptText}".`;
            }

            if (hasReference) {
                modificationInstruction += ` For this task, you MUST adapt the design from the reference image labeled '${attr.key}'.`;
            }
            attributesToModify.push(modificationInstruction);

        } else {
            const originalDescription = attr.aiKeyword && attr.aiKeyword.toLowerCase() !== 'n/a' ? attr.aiKeyword : `the original ${attr.label}`;
            attributesToMaintain.push(`- **${attr.label}:** Replicate this attribute PERFECTLY from the base image. It must be: "${originalDescription}". Preserve its shape, color, style, and position without ANY changes.`);
        }
    });
    
    const maintainSection = attributesToMaintain.length > 0 ? `\n\n**PART 2: ATTRIBUTE REPLICATION (MAINTAIN THESE EXACTLY)**\n${attributesToMaintain.join('\n')}` : '';
    const modifySection = attributesToModify.length > 0 ? `\n\n**PART 3: FOCUSED MODIFICATIONS (EXECUTE THESE PRECISELY)**\n${attributesToModify.join('\n')}` : '';

    return `MASTER PROMPT FOR IMAGE GENERATION\n\n${coreRules}${maintainSection}${modifySection}`;
  }

  private constructFinalParts(): any[] {
    const finalPrompt = this.constructFinalPrompt();
    
    const finalPromptPart = { text: finalPrompt };
    const baseImagePart = { inlineData: { mimeType: "image/png", data: this.base64ImageData()! } };
    
    const referenceParts: any[] = [];
    this.attributes().forEach(attr => {
        const reference = this.attributeReferences()[attr.key];
        if (!attr.isActive && reference) {
            referenceParts.push({ text: `This is the reference image labeled '${attr.key}':` });
            referenceParts.push({ inlineData: { mimeType: reference.mimeType, data: reference.base64 } });
        }
    });
    
    return [finalPromptPart, baseImagePart, ...referenceParts];
  }
  
  downloadImage(event: MouseEvent, imageUrl: string): void {
    event.stopPropagation();
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `nft-creation-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // --- UI Control ---

  reset(): void {
    // Validar que no haya operaciones en curso
    if (this.isAnalyzing() || this.isGenerating()) {
      this.showToast('Please wait for the current operation to finish.');
      return;
    }
    
    // Resetear datos principales
    this.base64ImageData.set(null);
    this.baseImageURL.set(null);
    this.attributeReferences.set({});
    this.aiAnalysisData.set(null);
    this.attributes.set(this.initializeAttributes());
    this.workingMode.set('full');
    
    // Resetear flags de estado
    this.isAnalyzing.set(false);
    this.isGenerating.set(false);
    
    // Resetear UI
    this.modalImageIndex.set(null);
    this.toastMessage.set(null);
    this.variationCount.set(1);
    
    // Limpiar timeout de toast si existe
    if ((this as any).toastTimeout) {
      clearTimeout((this as any).toastTimeout);
      (this as any).toastTimeout = null;
    }
    
    // Limpiar promise de análisis si existe
    this.analysisPromise = null;
    
    // Forzar actualización
    this.cdr.detectChanges();
    
    // Keep generatedResults (como estaba originalmente)
  }
}
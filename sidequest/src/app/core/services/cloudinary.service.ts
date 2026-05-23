import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private readonly cloudName    = environment.cloudinary.cloudName;
  private readonly uploadPreset = environment.cloudinary.uploadPreset;

  /** Upload a participant avatar to the dedicated avatars folder. */
  uploadAvatar(file: File): Promise<string> {
    return this.uploadImage(file, 'sidequest-avatars');
  }

  /** General-purpose upload to an arbitrary Cloudinary folder. */
  uploadImage(file: File, folder: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', folder);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`);
      xhr.onload  = () => xhr.status === 200
        ? resolve(JSON.parse(xhr.responseText).secure_url)
        : reject(new Error('Cloudinary upload failed.'));
      xhr.onerror = () => reject(new Error('Network error during upload.'));
      xhr.send(formData);
    });
  }
}

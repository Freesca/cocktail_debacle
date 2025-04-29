import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-cocktail',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-cocktail.component.html',
  styleUrls: ['./add-cocktail.component.scss'],
})
export class AddCocktailComponent {
  form: FormGroup;
  loading = false;
  imagePreview: string | ArrayBuffer | null = null;
  selectedImageFile: File | null = null;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      strDrink: ['', Validators.required],
      strCategory: ['', Validators.required],
      strAlcoholic: ['', Validators.required],
      strInstructions: ['', Validators.required],
      ingredients: this.fb.array([
        this.createIngredientFormGroup()
      ])
    });
  }

  get ingredients() {
    return this.form.get('ingredients') as FormArray;
  }

  createIngredientFormGroup(): FormGroup {
    return this.fb.group({
      ingredient: ['', Validators.required],
      measure: ['', Validators.required],
    });
  }

  addIngredient() {
    if (this.ingredients.length < 15) {
      this.ingredients.push(this.createIngredientFormGroup());
    }
  }

  removeIngredient(index: number) {
    if (this.ingredients.length > 1) {
      this.ingredients.removeAt(index);
    }
  }


  triggerFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }
  
  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    const formData = new FormData();
    formData.append('strDrink', this.form.value.strDrink);
    formData.append('strCategory', this.form.value.strCategory);
    formData.append('strAlcoholic', this.form.value.strAlcoholic);
    formData.append('strInstructions', this.form.value.strInstructions);
    
    this.form.value.ingredients.forEach((ingredient: any, index: number) => {
      formData.append(`strIngredient${index + 1}`, ingredient.ingredient);
      formData.append(`strMeasure${index + 1}`, ingredient.measure);
    });

    if (this.selectedImageFile) {
      formData.append('image', this.selectedImageFile);
    }

    // Qui puoi inviare il formData via HTTP POST al backend
    console.log('Form inviato!', formData);

    // Simula loading
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      alert('Cocktail aggiunto!');
    }, 1500);
  }
  
}

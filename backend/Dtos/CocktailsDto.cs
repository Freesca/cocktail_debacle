namespace backend.DTOs;

public class CocktailDto
{
    public string IdDrink { get; set; } = string.Empty;
    public string StrDrink { get; set; } = string.Empty;
    public string StrCategory { get; set; } = string.Empty;
    public string StrAlcoholic { get; set; } = string.Empty;
    public string StrGlass { get; set; } = string.Empty;
    public string StrInstructions { get; set; } = string.Empty;
    public string StrDrinkThumb { get; set; } = string.Empty;
    public List<string> Ingredients { get; set; } = new List<string>();
    public int Popularity { get; set; } // numero utenti che l'hanno salvato
    public int ReviewsCount { get; set; } // numero recensioni
}
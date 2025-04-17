namespace backend.DTOs.Review;

public class ReviewCreateDto
{
    public double Rating { get; set; }
    public string Comment { get; set; } = null!;
    public string? CocktailId { get; set; }

    public string GooglePlaceId { get; set; } = null!;
    public double? Latitude { get; set; } // ← aggiunto
    public double? Longitude { get; set; } // ← aggiunto
}

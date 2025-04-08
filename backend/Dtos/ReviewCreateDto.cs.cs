namespace backend.DTOs.Review;

public class ReviewCreateDto
{
    public double Rating { get; set; }
    public string Comment { get; set; } = null!;

    // Almeno uno dei due deve essere fornito
    public string? CocktailExternalId { get; set; }
    public int? CocktailId { get; set; }

    public string GooglePlaceId { get; set; } = null!;
}

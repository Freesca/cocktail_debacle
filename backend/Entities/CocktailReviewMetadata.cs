namespace backend.Entities;

public class CocktailReviewMetadata
{
    public int Id { get; set; }

    public int CocktailId { get; set; }
    public Cocktail Cocktail { get; set; } = null!;

    public int PlaceId { get; set; }
    public Place Place { get; set; } = null!;

    public double AverageScore { get; set; }
    public int ReviewCount { get; set; }
}
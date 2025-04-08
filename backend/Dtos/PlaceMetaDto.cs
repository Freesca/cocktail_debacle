namespace backend.DTOs.PlaceMeta;

public class PlaceMetaDto
{
    public int CocktailId { get; set; }
    public string ExternalId { get; set; } = null!;
    public string? Name { get; set; }
    public double AverageScore { get; set; }
    public int ReviewCount { get; set; }
}

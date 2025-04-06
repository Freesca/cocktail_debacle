using backend.Data;
using backend.DTOs.Review;
using backend.DTOs.CocktailMeta;
using backend.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("reviews")]
public class ReviewController(AppDbContext db, UserManager<User> userManager) : ControllerBase
{
    private readonly AppDbContext _db = db;
    private readonly UserManager<User> _userManager = userManager;

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> AddReview([FromBody] CreateReviewDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized();

        // Trova o crea il Place
        var place = await _db.Places.FirstOrDefaultAsync(p => p.GooglePlaceId == dto.GooglePlaceId);
        if (place == null)
        {
            place = new Place { GooglePlaceId = dto.GooglePlaceId };
            _db.Places.Add(place);
            await _db.SaveChangesAsync();
        }

        // Trova o crea il Cocktail
        Cocktail? cocktail = null;
        if (dto.CocktailId.HasValue)
        {
            cocktail = await _db.Cocktail.FindAsync(dto.CocktailId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(dto.CocktailExternalId))
        {
            cocktail = await _db.Cocktail.FirstOrDefaultAsync(c => c.ExternalId == dto.CocktailExternalId);
        }

        if (cocktail == null)
        {
            if (dto.CocktailId.HasValue)
            {
                return BadRequest("Cocktail not found.");
            }
            cocktail = new Cocktail
            {
                ExternalId = dto.CocktailExternalId ?? "",
            };
            _db.Cocktail.Add(cocktail);
            await _db.SaveChangesAsync();
        }

        // Crea la recensione
        var review = new Review
        {
            Rating = dto.Rating,
            Comment = dto.Comment,
            UserId = user.Id,
            PlaceId = place.Id,
            CocktailId = cocktail.Id,
            CreatedAt = DateTime.UtcNow
        };

        _db.Reviews.Add(review);
        await _db.SaveChangesAsync();

        // Trova o crea il metadata
        var metadata = await _db.CocktailReviewMetadatas
            .FirstOrDefaultAsync(m => m.PlaceId == place.Id && m.CocktailId == cocktail.Id);
        
        if (metadata == null)
        {
            metadata = new CocktailReviewMetadata
            {
                PlaceId = place.Id,
                CocktailId = cocktail.Id,
                ReviewCount = 1,
                AverageScore = dto.Rating
            };
            _db.CocktailReviewMetadatas.Add(metadata);
        }
        else
        {
            // Calcola nuova media: (media corrente * num_recensioni + nuovo voto) / (num_recensioni + 1)
            metadata.AverageScore = (metadata.AverageScore * metadata.ReviewCount + dto.Rating) / (metadata.ReviewCount + 1);
            metadata.ReviewCount += 1;
        }
        
        await _db.SaveChangesAsync();

        return Ok(new { message = "Review added successfully." });
    }

    [Authorize]
    [HttpGet("metadata/cocktail/{cocktailIdOrExternal}")]
    public async Task<IActionResult> GetMetadataCocktail(string cocktailIdOrExternal)
    {
        Cocktail? cocktail;

        // Prova a convertire in int → vuol dire che è un ID interno
        if (int.TryParse(cocktailIdOrExternal, out var intId))
        {
            cocktail = await _db.Cocktail.FirstOrDefaultAsync(c => c.Id == intId);
        }
        else
        {
            cocktail = await _db.Cocktail.FirstOrDefaultAsync(c => c.ExternalId == cocktailIdOrExternal);
        }

        if (cocktail == null)
            return NotFound("Cocktail not found");

        var results = await _db.CocktailReviewMetadatas
            .Where(m => m.CocktailId == cocktail.Id)
            .Include(m => m.Place)
            .Select(m => new CocktailMetaDto
            {
                PlaceId = m.PlaceId,
                GooglePlaceId = m.Place.GooglePlaceId,
                AverageScore = m.AverageScore,
                ReviewCount = m.ReviewCount
            })
            .ToListAsync();

        return Ok(results);
    }

}

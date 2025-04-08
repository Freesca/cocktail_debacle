using backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Entities;

namespace backend.Controllers;

[ApiController]
[Route("user/reviews")]
public class UserReviewController(AppDbContext db, UserManager<User> userManager) : ControllerBase
{
    private readonly AppDbContext _db = db;
    private readonly UserManager<User> _userManager = userManager;

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetUserReviews()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized();

        var reviews = await _db.Reviews
            .Where(r => r.UserId == user.Id)
            .Include(r => r.Cocktail)
            .Include(r => r.Place)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.Rating,
                r.Comment,
                r.CreatedAt,
                Cocktail = new { r.Cocktail.Id, r.Cocktail.ExternalId, r.Cocktail.Name },
                Place = new { r.Place.Id, r.Place.GooglePlaceId }
            })
            .ToListAsync();

        return Ok(reviews);
    }
}
